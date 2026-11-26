// Sync tra i telefoni: parla con /api/sync (vedi api/sync.ts).
import type { Song } from './types';

const CODE_KEY = 'karaoke.family.v1';

export type SyncStatus =
  | 'off' // nessun codice famiglia: solo su questo telefono
  | 'syncing'
  | 'ok'
  | 'offline' // niente rete: riprova da sola quando torna
  | 'wrong_code'
  | 'not_configured' // manca FAMILY_CODE su Vercel
  | 'error';

export function getCode(): string {
  try {
    return localStorage.getItem(CODE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setCode(code: string) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {
    /* storage bloccato */
  }
}

/** Firma dell'elenco: cambia solo se cambia qualche canzone. */
export const signature = (songs: Song[]) =>
  songs
    .map((s) => `${s.id}:${s.updatedAt ?? 0}`)
    .sort()
    .join('|');

export async function syncSongs(
  songs: Song[],
  code: string,
): Promise<{ status: SyncStatus; songs?: Song[]; detail?: string }> {
  if (!code) return { status: 'off' };
  if (!navigator.onLine) return { status: 'offline' };
  try {
    // Il codice va nel corpo, non in un header: gli header non accettano lettere accentate.
    const r = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, songs }),
    });
    if (r.status === 401) return { status: 'wrong_code' };
    if (r.status === 503) return { status: 'not_configured' };
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as { error?: string };
      return { status: 'error', detail: `${r.status}${body.error ? ` ${body.error}` : ''}` };
    }
    const body = (await r.json()) as { songs: Song[] };
    return { status: 'ok', songs: body.songs };
  } catch (e) {
    return navigator.onLine ? { status: 'error', detail: String((e as Error)?.message ?? e) } : { status: 'offline' };
  }
}

export const statusText: Record<SyncStatus, string> = {
  off: 'Solo su questo telefono',
  syncing: 'Sincronizzo…',
  ok: 'Sincronizzato',
  offline: 'Senza rete: sincronizzo appena torna',
  wrong_code: 'Codice famiglia sbagliato',
  not_configured: 'Sync non ancora attivata sul server',
  error: 'Sync non riuscita, riprovo tra poco',
};
