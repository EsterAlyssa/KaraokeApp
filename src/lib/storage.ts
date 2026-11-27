// Salvataggio offline sul telefono (localStorage).
// Tenuto separato dal resto così in futuro si può aggiungere la sync tra i due telefoni.
import seed from '../data/seed.json';
import { today } from './format';
import { emptyNight, isNight, type NightState } from './night';
import { normalizeSong, withPeople } from './people';
import type { Song } from './types';

export type { NightState };

const SONGS_KEY = 'karaoke.songs.v1';
const NIGHT_KEY = 'karaoke.serata.v1';
const THEME_KEY = 'karaoke.theme.v1';
const ORIGINAL_KEY = 'karaoke.original.v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* spazio pieno o storage bloccato: l'app continua a funzionare in memoria */
  }
}

/**
 * Versione delle canzoni di partenza (src/data/seed.json). Va aumentata ogni volta che si
 * aggiungono canzoni o cantanti al seed: i telefoni già in uso le ricevono all'apertura.
 *   1 = import iniziale da Notion (133 canzoni)
 *   2 = + lista Vale e liste vecchie di Ester (180 canzoni, cantante "Con Vale")
 *   3 = + papà (da solo, con la mamma, con Ester), lista "mamma", resto dei duetti con la mamma
 */
export const SEED_VERSION = 3;
const SEED_VER_KEY = 'karaoke.seedver.v1';

/**
 * Porta le novità del seed in un elenco già in uso, senza perdere quello che si è fatto sul telefono:
 * - canzoni nuove: aggiunte;
 * - canzoni mai toccate sul telefono (niente `updatedAt`): prendono la versione del seed
 *   (così arrivano anche tonalità e cantanti corretti);
 * - canzoni già cantate/modificate: si aggiungono solo cantanti e mood nuovi
 *   (titolo, tonalità, date e gradimento restano quelli del telefono).
 */
export function applySeed(stored: Song[], seedSongs: Song[], now = Date.now()): Song[] {
  const byId = new Map(stored.map((s) => [s.id, normalizeSong(s)]));
  const same = (a: Song, b: Song) =>
    a.title === b.title &&
    a.artist === b.artist &&
    a.key === b.key &&
    a.people.join() === b.people.join() &&
    a.solo.join() === b.solo.join() &&
    a.moods.join() === b.moods.join();
  for (const raw of seedSongs) {
    const s = normalizeSong(raw);
    const cur = byId.get(s.id);
    if (!cur) {
      byId.set(s.id, s);
      continue;
    }
    if (!cur.updatedAt) {
      if (!same(cur, s)) byId.set(s.id, { ...s, lastSung: cur.lastSung, score: cur.score, updatedAt: now });
      continue;
    }
    const people = [...new Set([...cur.people, ...s.people])];
    const solo = [...new Set([...cur.solo, ...s.solo])];
    const moods = [...new Set([...cur.moods, ...s.moods])];
    if (people.length !== cur.people.length || solo.length !== cur.solo.length || moods.length !== cur.moods.length) {
      byId.set(s.id, withPeople({ ...cur, moods, updatedAt: now }, people, solo));
    }
  }
  return [...byId.values()];
}

/** Canzoni di partenza, nel formato nuovo (il seed è nel formato vecchio, vedi people.ts). */
const seedSongs = () => (seed as unknown as Song[]).map(normalizeSong);

export function loadSongs(): Song[] {
  const stored = read<Song[]>(SONGS_KEY);
  const ver = read<number>(SEED_VER_KEY) ?? 1;
  if (!stored) {
    write(SEED_VER_KEY, SEED_VERSION);
    return seedSongs();
  }
  // Le canzoni salvate col formato vecchio passano al nuovo (persone + "anche da solo").
  if (ver >= SEED_VERSION) return stored.map(normalizeSong);
  const updated = applySeed(stored, seed as unknown as Song[]);
  write(SONGS_KEY, updated);
  write(SEED_VER_KEY, SEED_VERSION);
  return updated;
}
export const saveSongs = (songs: Song[]) => write(SONGS_KEY, songs);

/** Lo stato della serata vale solo per oggi: il giorno dopo si riparte da zero. */
export function loadNight(): NightState {
  const raw = read<Record<string, unknown>>(NIGHT_KEY);
  // Formato vecchio (prima della sync della serata): seen era un elenco di id.
  const n: NightState | null = isNight(raw)
    ? raw
    : raw && Array.isArray(raw.seen)
      ? {
          ...emptyNight(String(raw.date), raw.serata !== false),
          seen: Object.fromEntries((raw.seen as string[]).map((id) => [id, 1])),
          draws: Number(raw.draws) || 0,
        }
      : null;
  if (n && n.date === today()) return n;
  return emptyNight(today(), n?.serata ?? true, n?.serataAt ?? 0);
}
export const saveNight = (n: NightState) => write(NIGHT_KEY, n);

export type Theme = 'day' | 'night';
export function loadTheme(): Theme {
  const t = read<Theme>(THEME_KEY);
  if (t === 'day' || t === 'night') return t;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}
export const saveTheme = (t: Theme) => write(THEME_KEY, t);

/** Filtro "Solo tonalità originale": solo su questo telefono (dipende dal karaoke in cui si è). */
export const loadOnlyOriginal = () => read<boolean>(ORIGINAL_KEY) === true;
export const saveOnlyOriginal = (v: boolean) => write(ORIGINAL_KEY, v);
