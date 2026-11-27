import { MOODS, type Song } from './types';

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Giorni passati dall'ultima volta cantata; null = mai cantata. */
export function daysSince(lastSung: string | null): number | null {
  if (!lastSung) return null;
  const [y, m, d] = lastSung.split('-').map(Number);
  const then = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((start - then) / 86_400_000));
}

export function relDays(d: number | null): string {
  if (d == null) return 'Mai cantata';
  if (d === 0) return 'Oggi';
  if (d === 1) return 'Ieri';
  if (d < 7) return `${d} giorni fa`;
  if (d < 30) {
    const w = Math.round(d / 7);
    return w === 1 ? '1 settimana fa' : `${w} settimane fa`;
  }
  if (d < 365) {
    const m = Math.round(d / 30);
    return m === 1 ? '1 mese fa' : `${m} mesi fa`;
  }
  return 'Più di un anno fa';
}

export const keyText = (k: number) => (k === 0 ? 'Originale' : k > 0 ? `+${k}` : `−${Math.abs(k)}`);


export const moodText = (s: Song) =>
  s.moods.map((id) => MOODS.find((x) => x.id === id)?.name ?? id).join(' · ');
