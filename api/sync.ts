// Funzione Vercel: POST /api/sync
// Il telefono manda tutte le sue canzoni, il server le unisce con quelle salvate
// (Vercel Blob privato "karaoke-canzoni") e restituisce l'elenco unito.
//
// Variabili d'ambiente su Vercel:
//   BLOB_READ_WRITE_TOKEN  creata da Vercel collegando lo store Blob al progetto
//   FAMILY_CODE            il "codice famiglia" scelto da Ester (da impostare a mano)
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
// Estensione .js obbligatoria: sul server Node risolve gli import ESM alla lettera.
import { mergeSongs, sameSongs } from '../src/lib/merge.js';
import type { Song } from '../src/lib/types.js';

const PATH = 'karaoke/songs.json';
const MAX_TRIES = 4;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

async function readStored(): Promise<{ songs: Song[]; etag: string | null }> {
  const r = await get(PATH, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return { songs: [], etag: null };
  const songs = JSON.parse(await new Response(r.stream).text()) as Song[];
  return { songs, etag: r.blob.etag };
}

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

async function write(songs: Song[], etag: string | null) {
  await put(PATH, JSON.stringify(songs), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

export async function POST(request: Request) {
  const expected = process.env.FAMILY_CODE;
  if (!expected) return json({ error: 'not_configured' }, 503);

  let incoming: Song[];
  let code: string;
  try {
    const body = (await request.json()) as { songs?: unknown; code?: unknown };
    // Il codice arriva nel corpo (accetta lettere accentate); l'header resta per le versioni vecchie dell'app.
    code = typeof body.code === 'string' ? body.code : (request.headers.get('x-family-code') ?? '');
    if (norm(code) !== norm(expected)) return json({ error: 'wrong_code' }, 401);
    if (!Array.isArray(body.songs) || body.songs.length > 5000) return json({ error: 'bad_request' }, 400);
    const bad = body.songs.find((s) => !isSong(s));
    if (bad) {
      console.error('[sync] canzone non valida', JSON.stringify(bad).slice(0, 300));
      return json({ error: 'bad_request' }, 400);
    }
    incoming = body.songs as Song[];
  } catch (e) {
    console.error('[sync] corpo non leggibile', e);
    return json({ error: 'bad_request' }, 400);
  }

  try {
    // Scrittura "ottimistica": se un altro telefono ha salvato nel frattempo, rileggo e riunisco.
    for (let i = 0; i < MAX_TRIES; i++) {
      const { songs: stored, etag } = await readStored();
      const merged = mergeSongs(stored, incoming);
      if (etag && sameSongs(stored, merged)) return json({ songs: merged });
      try {
        await write(merged, etag);
        return json({ songs: merged });
      } catch (e) {
        if (e instanceof BlobPreconditionFailedError) {
          console.warn(`[sync] ETag cambiato (tentativo ${i + 1}), rileggo e riunisco`);
          continue;
        }
        throw e;
      }
    }
    // Ultima spiaggia: rileggo, riunisco e salvo senza controllo (con due telefoni il rischio è minimo).
    console.warn('[sync] ETag sempre diverso: salvo senza controllo');
    const { songs: stored } = await readStored();
    const merged = mergeSongs(stored, incoming);
    await write(merged, null);
    return json({ songs: merged });
  } catch (e) {
    console.error('[sync] errore di lettura/scrittura del Blob', e);
    return json({ error: 'storage', detail: String((e as Error)?.message ?? e).slice(0, 200) }, 500);
  }
}
