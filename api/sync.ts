// Funzione Vercel: POST /api/sync
// Il telefono manda tutte le sue canzoni, il server le unisce con quelle salvate
// (Vercel Blob privato "karaoke-canzoni") e restituisce l'elenco unito.
//
// Variabili d'ambiente su Vercel:
//   BLOB_READ_WRITE_TOKEN  creata da Vercel collegando lo store Blob al progetto
//   FAMILY_CODE            il "codice famiglia" scelto da Ester (da impostare a mano)
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
import { mergeSongs, sameSongs } from '../src/lib/merge';
import type { Song } from '../src/lib/types';

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

export async function POST(request: Request) {
  const expected = process.env.FAMILY_CODE;
  if (!expected) return json({ error: 'not_configured' }, 503);
  const code = request.headers.get('x-family-code') ?? '';
  if (code.trim().toLowerCase() !== expected.trim().toLowerCase()) return json({ error: 'wrong_code' }, 401);

  let incoming: Song[];
  try {
    const body = (await request.json()) as { songs?: unknown };
    if (!Array.isArray(body.songs) || body.songs.length > 5000 || !body.songs.every(isSong)) {
      return json({ error: 'bad_request' }, 400);
    }
    incoming = body.songs;
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  // Scrittura "ottimistica": se un altro telefono ha salvato nel frattempo, rileggo e riunisco.
  for (let i = 0; i < MAX_TRIES; i++) {
    const { songs: stored, etag } = await readStored();
    const merged = mergeSongs(stored, incoming);
    if (etag && sameSongs(stored, merged)) return json({ songs: merged });
    try {
      await put(PATH, JSON.stringify(merged), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        ...(etag ? { ifMatch: etag } : {}),
      });
      return json({ songs: merged });
    } catch (e) {
      if (e instanceof BlobPreconditionFailedError) continue;
      throw e;
    }
  }
  return json({ error: 'busy' }, 409);
}
