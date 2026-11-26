import { useMemo, useState } from 'react';
import { Chip, TopBar } from '../components/Chip';
import { Icon } from '../components/Icon';
import { daysSince, keyText, moodText, relDays, whoText } from '../lib/format';
import { MOODS, SINGERS, type MoodId, type SingerId, type Song } from '../lib/types';

type Sort = 'old' | 'recent' | 'az';
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
}: {
  songs: Song[];
  onBack: () => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('old');
  const [open, setOpen] = useState(false);
  const [fSinger, setFSinger] = useState<SingerId | null>(null);
  const [fMoods, setFMoods] = useState<MoodId[]>([]);
  const [fNever, setFNever] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const age = (s: Song) => daysSince(s.lastSung) ?? 9999;
    const L = songs.filter(
      (s) =>
        (!q || `${s.title} ${s.artist}`.toLowerCase().includes(q)) &&
        (!fSinger || s.singers.includes(fSinger)) &&
        (fMoods.length === 0 || fMoods.some((m) => s.moods.includes(m))) &&
        (!fNever || s.lastSung == null),
    );
    if (sort === 'old') return L.sort((a, b) => age(b) - age(a) || a.title.localeCompare(b.title, 'it'));
    if (sort === 'recent') return L.sort((a, b) => (daysSince(a.lastSung) ?? 1e5) - (daysSince(b.lastSung) ?? 1e5));
    return L.sort((a, b) => a.title.localeCompare(b.title, 'it'));
  }, [songs, query, sort, fSinger, fMoods, fNever]);

  const nF = (fSinger ? 1 : 0) + fMoods.length + (fNever ? 1 : 0);

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
            <span className="label">Chi canta</span>
            <div className="chips">
              {SINGERS.map((o) => (
                <Chip key={o.id} selected={fSinger === o.id} onClick={() => setFSinger(fSinger === o.id ? null : o.id)}>
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

      <div className="list">
        <p className="muted small">
          {list.length === songs.length ? `${songs.length} canzoni` : `${list.length} di ${songs.length} canzoni`}
        </p>
        {list.map((s) => {
          const d = daysSince(s.lastSung);
          return (
            <button
              key={s.id}
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
