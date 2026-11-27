import { Icon } from '../components/Icon';
import { pool } from '../lib/draw';
import type { Theme } from '../lib/storage';
import { statusText, type SyncStatus } from '../lib/sync';
import { MOODS, PEOPLE, type MoodId, type PersonId, type Song } from '../lib/types';

const moodIcon = { allegra: 'sun', ballare: 'note', gruppo: 'group' } as const;

export function Home(props: {
  theme: Theme;
  onToggleTheme: () => void;
  syncStatus: SyncStatus;
  onSync: () => void;
  songs: Song[];
  /** Persone scelte in "Chi canta?". */
  people: PersonId[];
  onPeople: (p: PersonId[]) => void;
  moods: MoodId[];
  onMoods: (m: MoodId[]) => void;
  onlyOriginal: boolean;
  onOnlyOriginal: (v: boolean) => void;
  onDraw: () => void;
  onList: () => void;
  onAdd: () => void;
}) {
  const { theme, people, moods, onlyOriginal } = props;
  const night = theme === 'night';
  const n = pool(props.songs, { people, moods, serata: false, seen: [], onlyOriginal }).length;
  const filtered = moods.length > 0 || onlyOriginal;
  const what = n === 1 ? '1 sola canzone' : `${filtered ? '' : 'tutte le '}${n} canzoni`;
  const extra = `${moods.length ? ' con questo mood' : ''}${onlyOriginal ? ' in tonalità originale' : ''}`;
  const poolText =
    people.length === 0
      ? 'Scegli chi canta: anche più di una persona'
      : n === 0
        ? filtered
          ? 'Nessuna canzone con questa scelta'
          : 'Nessuna canzone per questa combinazione'
        : `Pesco tra ${what}${extra}`;
  // "Ester da sola", "Ester e Vale", "Ester, Mamma e Papà"
  const chosen = PEOPLE.filter((p) => people.includes(p.id)); // nell'ordine dei bollini
  const who =
    chosen.length === 0
      ? ''
      : chosen.length === 1
        ? `${chosen[0].name} ${chosen[0].solo}`
        : `${chosen.slice(0, -1).map((p) => p.name).join(', ')} e ${chosen[chosen.length - 1].name}`;

  const toggleMood = (id: MoodId) =>
    props.onMoods(moods.includes(id) ? moods.filter((m) => m !== id) : [...moods, id]);

  return (
    <main className="screen home">
      <div className="home__head">
        <div className="home__titles">
          <span className="eyebrow">Stasera si canta</span>
          <h1 className="display">
            Karaoke <em>di casa</em>
          </h1>
        </div>
        <button
          type="button"
          className="round round--lg glass sync-btn"
          aria-label={`Sincronizzazione: ${statusText[props.syncStatus]}`}
          onClick={props.onSync}
        >
          <Icon name="cloud" stroke={1.5} />
          <span className={`sync-dot sync-dot--badge sync-status--${props.syncStatus}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="round round--lg glass"
          aria-label={night ? 'Passa al tema giorno' : 'Passa al tema notte'}
          onClick={props.onToggleTheme}
        >
          <Icon name={night ? 'sun' : 'moon'} stroke={1.5} />
        </button>
      </div>

      <section className="stack">
        <div className="row-between">
          <h2 className="h2">Chi canta?</h2>
          {who && <span className="muted">{who}</span>}
        </div>
        <div className="singers" style={{ gridTemplateColumns: `repeat(${PEOPLE.length}, minmax(0, 1fr))` }}>
          {PEOPLE.map((o) => {
            const sel = people.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                className="singer"
                aria-pressed={sel}
                onClick={() => props.onPeople(sel ? people.filter((p) => p !== o.id) : [...people, o.id])}
              >
                <span className="singer__avatar">
                  {o.ini}
                  {sel && (
                    <span className="singer__check">
                      <Icon name="check" size={16} stroke={2.4} />
                    </span>
                  )}
                </span>
                <span className="singer__name">{o.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="stack">
        <div className="row-between">
          <h2 className="h2">Che atmosfera?</h2>
          <span className="muted">facoltativo</span>
        </div>
        <div className="grid3 grid3--tight">
          {MOODS.map((m) => {
            const sel = moods.includes(m.id);
            return (
              <button key={m.id} type="button" className="mood" aria-pressed={sel} onClick={() => toggleMood(m.id)}>
                <Icon name={moodIcon[m.id]} size={30} stroke={1.5} />
                {m.name}
                {sel && (
                  <span className="mood__check">
                    <Icon name="check" size={18} stroke={2.4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="toggle-row"
          role="switch"
          aria-checked={onlyOriginal}
          onClick={() => props.onOnlyOriginal(!onlyOriginal)}
        >
          <span className="toggle-row__text">
            <span className="toggle-row__title">Solo tonalità originale</span>
            <span className="muted small">Per i karaoke dove non si può cambiare tonalità</span>
          </span>
          <span className="switch" aria-hidden="true">
            <span className="switch__knob" />
          </span>
        </button>
        <p className="muted body">{poolText}</p>
      </section>

      <div className="home__actions">
        <button type="button" className="btn-primary btn-hero" onClick={props.onDraw} disabled={n === 0}>
          <Icon name="dice" size={38} stroke={1.5} />
          Pesca
        </button>
        <div className="grid2">
          <button type="button" className="btn-glass" onClick={props.onList}>
            <Icon name="list" stroke={1.5} />
            Lista
          </button>
          <button type="button" className="btn-glass" onClick={props.onAdd}>
            <Icon name="plus" stroke={1.5} />
            Aggiungi
          </button>
        </div>
      </div>
    </main>
  );
}
