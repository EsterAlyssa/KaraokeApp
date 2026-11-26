// Funzione Vercel: POST /api/sync
// Il telefono manda le sue canzoni (e la serata), il server le unisce con quelle salvate
// (Vercel Blob privato "karaoke-canzoni") e restituisce il risultato unito.
//
// Corpo: { code, songs: Song[], night?: NightState }   ->   { songs, night? }
// File nel Blob: karaoke/songs.json (canzoni), karaoke/night.json (serata condivisa)
//
// Variabili d'ambiente su Vercel:
//   BLOB_READ_WRITE_TOKEN  creata da Vercel collegando lo store Blob al progetto
//   FAMILY_CODE            il "codice famiglia" scelto da Ester (da impostare a mano)
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
// Estensione .js obbligatoria: sul server Node risolve gli import ESM alla lettera.
import { mergeSongs, sameSongs } from '../src/lib/merge.js';
import { isNight, mergeNight, nightSignature, type NightState } from '../src/lib/night.js';
import type { Song } from '../src/lib/types.js';

const SONGS_PATH = 'karaoke/songs.json';
const NIGHT_PATH = 'karaoke/night.json';
const MAX_TRIES = 4;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

function isSong(x: unknown): x is Song {
  const s = x as Song;
  return (
    !!s &&
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    typeof s.artist === 'string' &&
    typeof s.key === 'number' &&
    Array.isArray(s.singers) &&
    Array.isArray(s.moods) &&
    typeof s.score === 'number'
  );
}

/** Confronto tollerante: spazi ai lati, maiuscole e accenti scritti in modi diversi non contano. */
const norm = (s: string) => s.normalize('NFC').trim().toLowerCase();

async function readDoc<T>(path: string): Promise<{ value: T | null; etag: string | null }> {
  const r = await get(path, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return { value: null, etag: null };
  return { value: JSON.parse(await new Response(r.stream).text()) as T, etag: r.blob.etag };
}

async function writeDoc(path: string, value: unknown, etag: string | null) {
  await put(path, JSON.stringify(value), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

/**
 * Legge il documento, lo unisce con quello del telefono e lo salva solo se è cambiato.
 * Scrittura "ottimistica": se l'altro telefono ha salvato nel frattempo, rilegge e riunisce.
 */
async function syncDoc<T>(
  path: string,
  incoming: T,
  merge: (stored: T, incoming: T) => T,
  same: (a: T, b: T) => boolean,
): Promise<T> {
  for (let i = 0; i < MAX_TRIES; i++) {
    const { value: stored, etag } = await readDoc<T>(path);
    const merged = stored == null ? incoming : merge(stored, incoming);
    if (stored != null && etag && same(stored, merged)) return merged;
    try {
      await writeDoc(path, merged, etag);
      return merged;
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError) {
        console.warn(`[sync] ${path}: ETag cambiato (tentativo ${i + 1}), rileggo e riunisco`);
        continue;
      }
      throw e;
    }
  }
  // Ultima spiaggia: rileggo, riunisco e salvo senza controllo (con due telefoni il rischio è minimo).
  console.warn(`[sync] ${path}: ETag sempre diverso, salvo senza controllo`);
  const { value: stored } = await readDoc<T>(path);
  const merged = stored == null ? incoming : merge(stored, incoming);
  await writeDoc(path, merged, null);
  return merged;
}

export async function POST(request: Request) {
  const expected = process.env.FAMILY_CODE;
  if (!expected) return json({ error: 'not_configured' }, 503);

  let songs: Song[];
  let night: NightState | null = null;
  try {
    const body = (await request.json()) as { songs?: unknown; code?: unknown; night?: unknown };
    // Il codice arriva nel corpo (accetta lettere accentate); l'header resta per le versioni vecchie dell'app.
    const code = typeof body.code === 'string' ? body.code : (request.headers.get('x-family-code') ?? '');
    if (norm(code) !== norm(expected)) return json({ error: 'wrong_code' }, 401);
    if (!Array.isArray(body.songs) || body.songs.length > 5000) return json({ error: 'bad_request' }, 400);
    const bad = body.songs.find((s) => !isSong(s));
    if (bad) {
      console.error('[sync] canzone non valida', JSON.stringify(bad).slice(0, 300));
      return json({ error: 'bad_request' }, 400);
    }
    songs = body.songs as Song[];
    // La serata è facoltativa: le versioni vecchie dell'app non la mandano.
    if (body.night !== undefined) {
      if (!isNight(body.night)) {
        console.error('[sync] serata non valida', JSON.stringify(body.night).slice(0, 300));
        return json({ error: 'bad_request' }, 400);
      }
      night = body.night;
    }
  } catch (e) {
    console.error('[sync] corpo non leggibile', e);
    return json({ error: 'bad_request' }, 400);
  }

  try {
    const [mergedSongs, mergedNight] = await Promise.all([
      syncDoc(SONGS_PATH, songs, mergeSongs, sameSongs),
      night ? syncDoc(NIGHT_PATH, night, mergeNight, (a, b) => nightSignature(a) === nightSignature(b)) : null,
    ]);
    return json(mergedNight ? { songs: mergedSongs, night: mergedNight } : { songs: mergedSongs });
  } catch (e) {
    console.error('[sync] errore di lettura/scrittura del Blob', e);
    return json({ error: 'storage', detail: String((e as Error)?.message ?? e).slice(0, 200) }, 500);
  }
}
