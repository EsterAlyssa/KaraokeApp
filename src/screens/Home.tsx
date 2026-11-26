import { Icon } from '../components/Icon';
import { pool } from '../lib/draw';
import type { Theme } from '../lib/storage';
import { MOODS, SINGERS, type MoodId, type SingerId, type Song } from '../lib/types';

const moodIcon = { allegra: 'sun', ballare: 'note', gruppo: 'group' } as const;

export function Home(props: {
  theme: Theme;
  onToggleTheme: () => void;
  songs: Song[];
  singer: SingerId;
  onSinger: (s: SingerId) => void;
  moods: MoodId[];
  onMoods: (m: MoodId[]) => void;
  onDraw: () => void;
  onList: () => void;
  onAdd: () => void;
}) {
  const { theme, singer, moods } = props;
  const night = theme === 'night';
  const n = pool(props.songs, { singer, moods, serata: false, seen: [] }).length;
  const poolText =
    n === 0
      ? 'Nessuna canzone con questa scelta'
      : moods.length
        ? `Pesco tra ${n} canzoni con questo mood`
        : `Pesco tra tutte le ${n} canzoni`;

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
          className="round round--lg glass"
          aria-label={night ? 'Passa al tema giorno' : 'Passa al tema notte'}
          onClick={props.onToggleTheme}
        >
          <Icon name={night ? 'sun' : 'moon'} stroke={1.5} />
        </button>
      </div>

      <section className="stack">
        <h2 className="h2">Chi canta?</h2>
        <div className="grid3">
          {SINGERS.map((o) => {
            const sel = singer === o.id;
            return (
              <button
                key={o.id}
                type="button"
                className="singer"
                aria-pressed={sel}
                onClick={() => props.onSinger(o.id)}
              >
                <span className={`singer__avatar${o.ini.length > 1 ? ' singer__avatar--small' : ''}`}>
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
        <p className="muted body">{poolText}</p>
      </section>

      <div className="home__actions">
        <button type="button" className="btn-primary btn-hero" onClick={props.onDraw}>
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
