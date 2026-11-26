import { useRef, useState } from 'react';
import { TopBar } from '../components/Chip';
import { Icon } from '../components/Icon';
import { OLD_EVERY } from '../lib/draw';
import { daysSince, keyText, relDays, whoText } from '../lib/format';
import type { Song } from '../lib/types';

export type DrawPhase = 'card' | 'done' | 'empty';

export function Draw(props: {
  song: Song | null;
  phase: DrawPhase;
  isOld: boolean;
  draws: number;
  serata: boolean;
  onToggleSerata: () => void;
  onSing: () => void;
  onSkip: () => void;
  onNext: () => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const { song, phase, serata } = props;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);

  const left = OLD_EVERY - (props.draws % OLD_EVERY);
  const nextOldText =
    left === OLD_EVERY
      ? `Pescata n. ${props.draws}`
      : left === 1
        ? 'La prossima: una che non canti da tanto'
        : `Tra ${left} pescate: una che non canti da tanto`;

  const days = song ? daysSince(song.lastSung) : null;
  const oldText = days == null ? 'Mai cantata: proviamo?' : `Non la canti da ${relDays(days).replace(' fa', '')}`;

  const release = () => {
    if (start.current == null) return;
    start.current = null;
    setDragging(false);
    const d = dx;
    setDx(0);
    if (d > 100) props.onSing();
    else if (d < -100) props.onSkip();
  };

  return (
    <main className="screen screen--bar">
      <TopBar
        title="Pesca"
        onBack={props.onHome}
        action={
          <button type="button" className="chip" aria-pressed={serata} onClick={props.onToggleSerata}>
            <Icon name="moon" size={20} stroke={1.5} />
            {serata ? 'Serata: sì' : 'Serata: no'}
          </button>
        }
      />

      {phase === 'card' && song && (
        <div className="draw">
          <p className="muted center body">{nextOldText}</p>
          <div className="draw__area">
            <article
              className="card"
              aria-live="polite"
              onPointerDown={(e) => {
                start.current = e.clientX;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                setDragging(true);
              }}
              onPointerMove={(e) => start.current != null && setDx(e.clientX - start.current)}
              onPointerUp={release}
              onPointerCancel={release}
              style={{
                transform: `translateX(${dx}px) rotate(${(dx / 18).toFixed(2)}deg)`,
                transition: dragging ? 'none' : 'transform .25s ease',
              }}
            >
              <div className="card__band" aria-hidden="true" />
              {props.isOld && (
                <div className="badge">
                  <Icon name="clock" size={18} />
                  {oldText}
                </div>
              )}
              <div className="card__title">
                <h3 className="display display--card">{song.title}</h3>
                {song.artist && <p className="card__artist">{song.artist}</p>}
              </div>
              <div className="divider" />
              <div className="grid2">
                <div className="kv">
                  <span className="muted">Tonalità</span>
                  <span className="kv__big">{keyText(song.key)}</span>
                </div>
                <div className="kv">
                  <span className="muted">Ultima volta</span>
                  <span className="kv__mid">{relDays(days)}</span>
                </div>
              </div>
              <p className="muted body">Chi canta: {whoText(song)}</p>
              {dx > 50 && <div className="stamp stamp--yes">LA CANTO</div>}
              {dx < -50 && <div className="stamp stamp--no">UN'ALTRA</div>}
            </article>
          </div>
          <p className="muted center small">Trascina la scheda o usa i pulsanti</p>
          <div className="draw__buttons">
            <button type="button" className="big-action" onClick={props.onSkip}>
              <span className="big-action__circle glass">
                <Icon name="close" size={30} />
              </span>
              Un'altra
            </button>
            <button type="button" className="big-action" onClick={props.onSing}>
              <span className="big-action__circle big-action__circle--primary">
                <Icon name="check" size={34} stroke={1.8} />
              </span>
              La canto
            </button>
          </div>
        </div>
      )}

      {phase === 'done' && song && (
        <div className="centered">
          <span className="done-icon">
            <Icon name="check" size={52} stroke={1.5} />
          </span>
          <h3 className="display">Si canta!</h3>
          <p className="done-title">{song.title}</p>
          <p className="muted body">Tonalità {keyText(song.key)} · segnata come cantata oggi</p>
          <div className="stack stack--full">
            <button type="button" className="btn-primary" onClick={props.onNext}>
              Pesca la prossima
            </button>
            <button type="button" className="btn-glass" onClick={props.onHome}>
              Torna alla home
            </button>
          </div>
        </div>
      )}

      {phase === 'empty' && (
        <div className="centered">
          <h3 className="display display--sm">Finite le canzoni</h3>
          <p className="muted body">
            {serata
              ? 'Stasera avete già visto tutte le canzoni con questi filtri.'
              : 'Nessuna canzone corrisponde a questa scelta.'}
          </p>
          <div className="stack stack--full">
            {serata && (
              <button type="button" className="btn-primary" onClick={props.onRestart}>
                Ricomincia la serata
              </button>
            )}
            <button type="button" className="btn-glass" onClick={props.onHome}>
              Cambia filtri
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
