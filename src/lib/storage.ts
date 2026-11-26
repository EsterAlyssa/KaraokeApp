// Salvataggio offline sul telefono (localStorage).
// Tenuto separato dal resto così in futuro si può aggiungere la sync tra i due telefoni.
import seed from '../data/seed.json';
import { today } from './format';
import { emptyNight, isNight, type NightState } from './night';
import type { Song } from './types';

export type { NightState };

const SONGS_KEY = 'karaoke.songs.v1';
const NIGHT_KEY = 'karaoke.serata.v1';
const THEME_KEY = 'karaoke.theme.v1';

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

export const loadSongs = (): Song[] => read<Song[]>(SONGS_KEY) ?? (seed as Song[]);
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
