// La "serata": cosa si è già visto stasera e quante pescate si sono fatte.
// Condivisa tra i telefoni con la sync (vedi api/sync.ts). Usata sia dall'app sia dal server.

export interface NightState {
  /** Giorno della serata (YYYY-MM-DD). Il giorno dopo si riparte da zero. */
  date: string;
  /** Canzoni già viste stasera: id -> quando (ms). */
  seen: Record<string, number>;
  /** Quando si è fatto "Ricomincia la serata" (ms): le canzoni viste prima non contano più. */
  resetAt: number;
  /** Numero di pescate della serata (per la regola "ogni 5ª"). */
  draws: number;
  /** Modalità serata: niente ripetizioni. */
  serata: boolean;
  /** Quando è stato cambiato l'interruttore serata (ms): vince l'ultima scelta. */
  serataAt: number;
}

export const emptyNight = (date: string, serata = true, serataAt = 0): NightState => ({
  date,
  seen: {},
  resetAt: 0,
  draws: 0,
  serata,
  serataAt,
});

export const seenIds = (n: NightState) => Object.keys(n.seen);

export const markSeen = (n: NightState, id: string, now = Date.now()): NightState => ({
  ...n,
  seen: { ...n.seen, [id]: now },
});

export const restartNight = (n: NightState, now = Date.now()): NightState => ({ ...n, seen: {}, resetAt: now });

/** Unione di due serate. Regole: vedi CLAUDE.md, "Sync tra i telefoni". */
export function mergeNight(a: NightState, b: NightState): NightState {
  if (a.date !== b.date) {
    // Giorni diversi: vale la serata più recente. Si tiene però l'ultima scelta sull'interruttore.
    const newer = a.date > b.date ? a : b;
    const older = newer === a ? b : a;
    return older.serataAt > newer.serataAt ? { ...newer, serata: older.serata, serataAt: older.serataAt } : newer;
  }
  const resetAt = Math.max(a.resetAt, b.resetAt);
  const seen: Record<string, number> = {};
  for (const src of [a.seen, b.seen]) {
    for (const [id, t] of Object.entries(src)) {
      if (t > resetAt && t > (seen[id] ?? 0)) seen[id] = t;
    }
  }
  const sw = a.serataAt >= b.serataAt ? a : b;
  return {
    date: a.date,
    seen,
    resetAt,
    draws: Math.max(a.draws, b.draws),
    serata: sw.serata,
    serataAt: sw.serataAt,
  };
}

/** Firma della serata: cambia solo se cambia qualcosa che conta. */
export const nightSignature = (n: NightState) =>
  JSON.stringify([n.date, n.resetAt, n.draws, n.serata, n.serataAt, Object.entries(n.seen).sort()]);

export function isNight(x: unknown): x is NightState {
  const n = x as NightState;
  return (
    !!n &&
    typeof n.date === 'string' &&
    typeof n.seen === 'object' &&
    n.seen !== null &&
    !Array.isArray(n.seen) &&
    typeof n.resetAt === 'number' &&
    typeof n.draws === 'number' &&
    typeof n.serata === 'boolean' &&
    typeof n.serataAt === 'number'
  );
}
