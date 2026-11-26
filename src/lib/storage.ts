// Salvataggio offline sul telefono (localStorage).
// Tenuto separato dal resto così in futuro si può aggiungere la sync tra i due telefoni.
import seed from '../data/seed.json';
import { today } from './format';
import type { Song } from './types';

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

export interface NightState {
  date: string;
  seen: string[];
  draws: number;
  serata: boolean;
}

/** Lo stato della serata vale solo per oggi: il giorno dopo si riparte da zero. */
export function loadNight(): NightState {
  const n = read<NightState>(NIGHT_KEY);
  if (n && n.date === today()) return n;
  return { date: today(), seen: [], draws: 0, serata: n?.serata ?? true };
}
export const saveNight = (n: NightState) => write(NIGHT_KEY, n);

export type Theme = 'day' | 'night';
export function loadTheme(): Theme {
  const t = read<Theme>(THEME_KEY);
  if (t === 'day' || t === 'night') return t;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}
export const saveTheme = (t: Theme) => write(THEME_KEY, t);
