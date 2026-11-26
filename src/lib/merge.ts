// Unione di due elenchi di canzoni: usata sia dal telefono sia dal server (api/sync.ts).
// Regola: canzone per canzone, vince la versione modificata più di recente (updatedAt).
// Le canzoni presenti solo da una parte vengono tenute (così le nuove arrivano a tutti).
import type { Song } from './types';

export function mergeSongs(a: Song[], b: Song[]): Song[] {
  const byId = new Map<string, Song>();
  for (const s of a) byId.set(s.id, s);
  for (const s of b) {
    const cur = byId.get(s.id);
    if (!cur || (s.updatedAt ?? 0) > (cur.updatedAt ?? 0)) byId.set(s.id, s);
  }
  return [...byId.values()].sort((x, y) => x.title.localeCompare(y.title, 'it'));
}

/** true se i due elenchi contengono esattamente le stesse versioni delle canzoni. */
export function sameSongs(a: Song[], b: Song[]): boolean {
  if (a.length !== b.length) return false;
  const m = new Map(a.map((s) => [s.id, s.updatedAt ?? 0]));
  return b.every((s) => m.get(s.id) === (s.updatedAt ?? 0));
}
