// Regole di pesca: vedi CLAUDE.md, sezione "Regole di pesca".
import { daysSince } from './format';
import type { MoodId, SingerId, Song } from './types';

export interface DrawFilters {
  singer: SingerId;
  moods: MoodId[];
  /** Modalità serata: escludi le canzoni già viste stasera. */
  serata: boolean;
  seen: string[];
  /** Solo canzoni in tonalità originale (karaoke dove il video non si può trasporre). */
  onlyOriginal?: boolean;
}

/** Ogni quante pescate esce la canzone non cantata da più tempo. */
export const OLD_EVERY = 5;

const age = (s: Song) => daysSince(s.lastSung) ?? 9999;

export function pool(songs: Song[], f: DrawFilters): Song[] {
  return songs.filter(
    (s) =>
      s.singers.includes(f.singer) &&
      (f.moods.length === 0 || f.moods.some((m) => s.moods.includes(m))) &&
      (!f.onlyOriginal || s.key === 0) &&
      (!f.serata || !f.seen.includes(s.id)),
  );
}

export function weight(s: Song): number {
  return Math.max(0.5, 3 + s.score) * (1 + Math.min(age(s), 90) / 30);
}

export interface DrawResult {
  song: Song;
  /** true se è la pescata "da quanto tempo non la canti". */
  isOld: boolean;
}

/**
 * Pesca la prossima canzone.
 * @param drawNumber numero di questa pescata (1, 2, 3…)
 * @param currentId canzone appena mostrata, da non ripescare subito
 */
export function draw(
  songs: Song[],
  f: DrawFilters,
  drawNumber: number,
  currentId: string | null,
  random: () => number = Math.random,
): DrawResult | null {
  const all = pool(songs, f);
  const p = all.length > 1 ? all.filter((s) => s.id !== currentId) : all;
  if (p.length === 0) return null;

  if (drawNumber % OLD_EVERY === 0) {
    const song = p.slice().sort((a, b) => age(b) - age(a))[0];
    return { song, isOld: true };
  }

  const w = p.map(weight);
  let t = random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < p.length; i++) {
    t -= w[i];
    if (t <= 0) return { song: p[i], isOld: false };
  }
  return { song: p[p.length - 1], isOld: false };
}
