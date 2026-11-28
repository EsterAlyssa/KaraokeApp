import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Chip, TopBar } from '../components/Chip';
import { Icon } from '../components/Icon';
import { daysSince, keyText, moodText, relDays } from '../lib/format';
import { singsFor, whoText } from '../lib/people';
import { MOODS, PEOPLE, type MoodId, type PersonId, type Song } from '../lib/types';

type Sort = 'old' | 'recent' | 'az';

/** Come era la lista (ricerca, filtri, ordine, scorrimento): si ritrova dopo Modifica/Aggiungi. */
export type ListView = {
  query: string;
  sort: Sort;
  open: boolean;
  fPeople: PersonId[];
  fMoods: MoodId[];
  fNever: boolean;
  scrollTop: number;
};
const SORTS: [Sort, string][] = [
  ['old', 'Da più tempo'],
  ['recent', 'Recenti'],
  ['az', 'A–Z'],
];

export function SongList({
  songs,
  onBack,
  onAdd,
  onEdit,
  saved,
  focusId,
}: {
  songs: Song[];
  onBack: () => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  /** Dove ricordare come era la lista quando si esce (null = lista da capo). */
  saved: MutableRefObject<ListView | null>;
  /** Canzone appena modificata o aggiunta: se non si vede, la lista ci scorre sopra. */
  focusId?: string | null;
}) {
  const v = saved.current;
  const [query, setQuery] = useState(v?.query ?? '');
  const [sort, setSort] = useState<Sort>(v?.sort ?? 'old');
  const [open, setOpen] = useState(v?.open ?? false);
  const [fPeople, setFPeople] = useState<PersonId[]>(v?.fPeople ?? []);
  const [fMoods, setFMoods] = useState<MoodId[]>(v?.fMoods ?? []);
  const [fNever, setFNever] = useState(v?.fNever ?? false);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTop = useRef(v?.scrollTop ?? 0);

  // Salvo lo stato a ogni cambio (lo scorrimento lo segue onScroll).
  useEffect(() => {
    saved.current = { query, sort, open, fPeople, fMoods, fNever, scrollTop: scrollTop.current };
  }, [saved, query, sort, open, fPeople, fMoods, fNever]);

  // All'apertura: torno dov'ero; se la canzone toccata non si vede (es. l'ordine è cambiato), ci vado.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = scrollTop.current;
    const card = focusId ? el.querySelector<HTMLElement>(`[data-id="${CSS.escape(focusId)}"]`) : null;
    if (card) {
      const box = el.getBoundingClientRect();
      const r = card.getBoundingClientRect();
      if (r.top < box.top || r.bottom > box.bottom) card.scrollIntoView({ block: 'center' });
      card.focus({ preventScroll: true });
    }
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const age = (s: Song) => daysSince(s.lastSung) ?? 9999;
    const L = songs.filter(
      (s) =>
        (!q || `${s.title} ${s.artist}`.toLowerCase().includes(q)) &&
        (fPeople.length === 0 || singsFor(s, fPeople)) &&
        (fMoods.length === 0 || fMoods.some((m) => s.moods.includes(m))) &&
        (!fNever || s.lastSung == null),
    );
    if (sort === 'old') return L.sort((a, b) => age(b) - age(a) || a.title.localeCompare(b.title, 'it'));
    if (sort === 'recent') return L.sort((a, b) => (daysSince(a.lastSung) ?? 1e5) - (daysSince(b.lastSung) ?? 1e5));
    return L.sort((a, b) => a.title.localeCompare(b.title, 'it'));
  }, [songs, query, sort, fPeople, fMoods, fNever]);

  const nF = fPeople.length + fMoods.length + (fNever ? 1 : 0);

  return (
    <main className="screen screen--bar">
      <TopBar
        title="Le canzoni"
        onBack={onBack}
        action={
          <button type="button" className="round round--primary" aria-label="Aggiungi canzone" onClick={onAdd}>
            <Icon name="plus" size={22} stroke={1.7} />
          </button>
        }
      />

      <div className="list-tools">
        <label className="search">
          <span className="sr-only">Cerca titolo o artista</span>
          <Icon name="search" size={22} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca titolo o artista"
          />
        </label>
        <div className="chips">
          {SORTS.map(([id, label]) => (
            <Chip key={id} selected={sort === id} onClick={() => setSort(id)}>
              {label}
            </Chip>
          ))}
          <button
            type="button"
            className="chip chip--end"
            aria-pressed={open || nF > 0}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name="filter" size={18} />
            {nF ? `Filtri (${nF})` : 'Filtri'}
          </button>
        </div>
        {open && (
          <div className="filters">
            <span className="label">Chi canta (come nella pesca)</span>
            <div className="chips">
              {PEOPLE.map((o) => (
                <Chip
                  key={o.id}
                  selected={fPeople.includes(o.id)}
                  onClick={() => setFPeople(fPeople.includes(o.id) ? fPeople.filter((x) => x !== o.id) : [...fPeople, o.id])}
                >
                  {o.name}
                </Chip>
              ))}
            </div>
            <span className="label">Mood</span>
            <div className="chips">
              {MOODS.map((o) => (
                <Chip
                  key={o.id}
                  selected={fMoods.includes(o.id)}
                  onClick={() => setFMoods(fMoods.includes(o.id) ? fMoods.filter((m) => m !== o.id) : [...fMoods, o.id])}
                >
                  {o.name}
                </Chip>
              ))}
              <Chip selected={fNever} onClick={() => setFNever(!fNever)}>
                Mai cantate
              </Chip>
            </div>
          </div>
        )}
      </div>

      <div
        className="list"
        ref={listRef}
        onScroll={(e) => {
          scrollTop.current = e.currentTarget.scrollTop;
          if (saved.current) saved.current.scrollTop = scrollTop.current;
        }}
      >
        <p className="muted small">
          {list.length === songs.length ? `${songs.length} canzoni` : `${list.length} di ${songs.length} canzoni`}
        </p>
        {list.map((s) => {
          const d = daysSince(s.lastSung);
          return (
            <button
              key={s.id}
              data-id={s.id}
              type="button"
              className="song glass"
              aria-label={`Modifica ${s.title}${s.artist ? `, ${s.artist}` : ''}`}
              onClick={() => onEdit(s.id)}
            >
              <div className="song__top">
                <div className="song__titles">
                  <span className="song__title">{s.title}</span>
                  {s.artist && <span className="muted song__artist">{s.artist}</span>}
                </div>
                <span className="key-pill" aria-label={`Tonalità ${keyText(s.key)}`}>
                  {keyText(s.key)}
                </span>
              </div>
              <div className="song__meta">
                <span className={`song__last${d == null ? ' song__last--never' : ''}`}>
                  <Icon name="clock" size={16} />
                  {relDays(d)}
                </span>
                <span>{whoText(s)}</span>
                {s.moods.length > 0 && <span className="tag">{moodText(s)}</span>}
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="muted center body">Nessuna canzone con questi filtri.</p>}
      </div>
    </main>
  );
}
