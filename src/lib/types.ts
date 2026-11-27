/** Le persone che cantano. */
export type PersonId = 'ester' | 'mamma' | 'papa' | 'vale';

/**
 * Formato vecchio di "chi canta" (fino al 2026-11-27): una voce per persona o coppia.
 * Si continua a scriverlo accanto a `people`/`solo` (vedi `legacySingers` in people.ts) così
 * le versioni vecchie dell'app sui telefoni non ancora aggiornati non si rompono con la sync.
 */
export type LegacySingerId = 'ester' | 'mamma' | 'papa' | 'insieme' | 'vale' | 'ester_papa' | 'papa_mamma';
export type MoodId = 'allegra' | 'ballare' | 'gruppo';

export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Tonalità in semitoni rispetto all'originale (0 = originale). */
  key: number;
  /** Chi la canta (una o più persone). */
  people: PersonId[];
  /** Chi tra loro la canta anche da solo/a. Le altre persone la cantano solo in compagnia. */
  solo: PersonId[];
  /** Formato vecchio, derivato da people/solo: non usarlo nel codice nuovo. */
  singers: LegacySingerId[];
  moods: MoodId[];
  /** Data dell'ultima volta cantata (YYYY-MM-DD), null = mai cantata. */
  lastSung: string | null;
  /** Gradimento: +1 quando si canta, −1 quando si scarta. */
  score: number;
  /** Quando è stata modificata l'ultima volta (ms). Serve alla sync: vince la più recente. 0 = mai toccata. */
  updatedAt?: number;
}

export const PEOPLE: { id: PersonId; name: string; ini: string; solo: string }[] = [
  { id: 'ester', name: 'Ester', ini: 'E', solo: 'da sola' },
  { id: 'mamma', name: 'Mamma', ini: 'M', solo: 'da sola' },
  { id: 'papa', name: 'Papà', ini: 'P', solo: 'da solo' },
  { id: 'vale', name: 'Vale', ini: 'V', solo: 'da solo' },
];

export const personName = (id: PersonId) => PEOPLE.find((p) => p.id === id)?.name ?? id;

export const MOODS: { id: MoodId; name: string }[] = [
  { id: 'allegra', name: 'Allegra' },
  { id: 'ballare', name: 'Da ballare' },
  { id: 'gruppo', name: 'Di gruppo' },
];
