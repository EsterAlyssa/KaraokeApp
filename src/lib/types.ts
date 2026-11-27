/** Le persone che cantano. In home si scelgono una o più persone. */
export type PersonId = 'ester' | 'mamma' | 'papa' | 'vale';

/**
 * Chi canta una canzone: una persona da sola o una coppia.
 * Gli id 'insieme' (Ester + mamma) e 'vale' (Ester + Vale) restano così per compatibilità
 * con i dati già salvati e sincronizzati.
 */
export type SingerId = 'ester' | 'mamma' | 'papa' | 'insieme' | 'vale' | 'ester_papa' | 'papa_mamma';
export type MoodId = 'allegra' | 'ballare' | 'gruppo';

export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Tonalità in semitoni rispetto all'originale (0 = originale). */
  key: number;
  /** Chi la può cantare: ogni voce è una persona o una coppia (vedi SINGERS). */
  singers: SingerId[];
  moods: MoodId[];
  /** Data dell'ultima volta cantata (YYYY-MM-DD), null = mai cantata. */
  lastSung: string | null;
  /** Gradimento: +1 quando si canta, −1 quando si scarta. */
  score: number;
  /** Quando è stata modificata l'ultima volta (ms). Serve alla sync: vince la più recente. 0 = mai toccata. */
  updatedAt?: number;
}

export const PEOPLE: { id: PersonId; name: string; ini: string }[] = [
  { id: 'ester', name: 'Ester', ini: 'E' },
  { id: 'mamma', name: 'Mamma', ini: 'M' },
  { id: 'papa', name: 'Papà', ini: 'P' },
  { id: 'vale', name: 'Vale', ini: 'V' },
];

/** Tutte le combinazioni che hanno canzoni: da soli e in coppia. */
export const SINGERS: { id: SingerId; name: string; people: PersonId[] }[] = [
  { id: 'ester', name: 'Ester', people: ['ester'] },
  { id: 'mamma', name: 'Mamma', people: ['mamma'] },
  { id: 'papa', name: 'Papà', people: ['papa'] },
  { id: 'insieme', name: 'Ester e mamma', people: ['ester', 'mamma'] },
  { id: 'ester_papa', name: 'Ester e papà', people: ['ester', 'papa'] },
  { id: 'vale', name: 'Ester e Vale', people: ['ester', 'vale'] },
  { id: 'papa_mamma', name: 'Papà e mamma', people: ['mamma', 'papa'] },
];

/** La combinazione corrispondente alle persone scelte (null se non esiste, es. Vale da sola). */
export function singerFor(people: PersonId[]): SingerId | null {
  const key = [...people].sort().join('+');
  return SINGERS.find((s) => [...s.people].sort().join('+') === key)?.id ?? null;
}

export const singerName = (id: SingerId) => SINGERS.find((s) => s.id === id)?.name ?? id;

export const MOODS: { id: MoodId; name: string }[] = [
  { id: 'allegra', name: 'Allegra' },
  { id: 'ballare', name: 'Da ballare' },
  { id: 'gruppo', name: 'Di gruppo' },
];
