// "Chi canta": persone + chi la canta anche da solo. Regole decise da Ester il 2026-11-27.
import { PEOPLE, personName, type LegacySingerId, type MoodId, type PersonId, type Song } from './types';

const ALL: PersonId[] = PEOPLE.map((p) => p.id);
const order = (ids: Iterable<PersonId>) => ALL.filter((p) => new Set(ids).has(p));

/**
 * La canzone esce in pesca per le persone scelte?
 * - una persona: solo se la canta anche da sola;
 * - due o più: solo se le canta tutte (duetto o canzone che cantano anche separatamente).
 */
export function singsFor(s: Song, selected: PersonId[]): boolean {
  if (selected.length === 0) return false;
  if (selected.length === 1) return s.solo.includes(selected[0]);
  return selected.every((p) => s.people.includes(p));
}

/** Dal formato vecchio (coppie) al nuovo. Le canzoni "Di gruppo" diventano di tutti, senza "da soli". */
export function fromLegacy(singers: LegacySingerId[], moods: MoodId[]): { people: PersonId[]; solo: PersonId[] } {
  const people = new Set<PersonId>();
  const solo = new Set<PersonId>();
  for (const id of singers) {
    if (id === 'ester' || id === 'mamma' || id === 'papa') {
      people.add(id);
      solo.add(id);
    } else if (id === 'insieme') {
      people.add('ester').add('mamma');
    } else if (id === 'vale') {
      people.add('ester').add('vale');
    } else if (id === 'ester_papa') {
      people.add('ester').add('papa');
    } else if (id === 'papa_mamma') {
      people.add('papa').add('mamma');
    }
  }
  if (moods.includes('gruppo')) ALL.forEach((p) => people.add(p));
  return { people: order(people), solo: order(solo) };
}

/** Il formato vecchio corrispondente, per le versioni vecchie dell'app (vedi types.ts). */
export function legacySingers(people: PersonId[], solo: PersonId[]): LegacySingerId[] {
  const out: LegacySingerId[] = [];
  for (const p of solo) if (p !== 'vale') out.push(p);
  const has = (p: PersonId) => people.includes(p);
  if (has('ester') && has('mamma')) out.push('insieme');
  if (has('ester') && has('vale')) out.push('vale');
  if (has('ester') && has('papa')) out.push('ester_papa');
  if (has('papa') && has('mamma')) out.push('papa_mamma');
  return out;
}

/** Porta una canzone (anche arrivata dalla sync o dal seed) al formato nuovo, senza cambiare updatedAt. */
export function normalizeSong(s: Song): Song {
  const raw = s as Partial<Song> & Song;
  if (Array.isArray(raw.people) && Array.isArray(raw.solo)) {
    return Array.isArray(raw.singers) ? s : { ...s, singers: legacySingers(raw.people, raw.solo) };
  }
  const { people, solo } = fromLegacy(raw.singers ?? [], raw.moods ?? []);
  return { ...s, people, solo };
}

/** Imposta chi canta (dal modulo di modifica), tenendo coerente il formato vecchio. */
export function withPeople(
  s: Omit<Song, 'singers' | 'people' | 'solo'> & Partial<Pick<Song, 'singers' | 'people' | 'solo'>>,
  people: PersonId[],
  solo: PersonId[],
): Song {
  const p = order(people);
  const so = order(solo.filter((x) => people.includes(x)));
  return { ...s, people: p, solo: so, singers: legacySingers(p, so) } as Song;
}

/** "Ester e Vale · da sola: Ester" */
export function whoText(s: Song): string {
  const names = s.people.map(personName);
  const list = names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
  if (s.people.length <= 1) return list;
  if (s.people.length === ALL.length && s.solo.length === 0) return 'Tutti insieme';
  if (s.solo.length === 0) return `${list} · solo insieme`;
  if (s.solo.length === s.people.length) return `${list} · anche da soli`;
  if (s.solo.length === 1) {
    const p = PEOPLE.find((x) => x.id === s.solo[0]);
    return `${list} · ${p?.name} anche ${p?.solo}`;
  }
  return `${list} · anche da soli: ${s.solo.map(personName).join(', ')}`;
}
