export type SingerId = 'ester' | 'mamma' | 'insieme';
export type MoodId = 'allegra' | 'ballare' | 'gruppo';

export interface Song {
  id: string;
  title: string;
  artist: string;
  /** Tonalità in semitoni rispetto all'originale (0 = originale). */
  key: number;
  singers: SingerId[];
  moods: MoodId[];
  /** Data dell'ultima volta cantata (YYYY-MM-DD), null = mai cantata. */
  lastSung: string | null;
  /** Gradimento: +1 quando si canta, −1 quando si scarta. */
  score: number;
  /** Quando è stata modificata l'ultima volta (ms). Serve alla sync: vince la più recente. 0 = mai toccata. */
  updatedAt?: number;
}

export const SINGERS: { id: SingerId; name: string; ini: string }[] = [
  { id: 'ester', name: 'Ester', ini: 'E' },
  { id: 'mamma', name: 'Mamma', ini: 'M' },
  { id: 'insieme', name: 'Insieme', ini: 'E+M' },
];

export const MOODS: { id: MoodId; name: string }[] = [
  { id: 'allegra', name: 'Allegra' },
  { id: 'ballare', name: 'Da ballare' },
  { id: 'gruppo', name: 'Di gruppo' },
];
