import { useState } from 'react';
import { Chip, TopBar } from '../components/Chip';
import { Icon } from '../components/Icon';
import { keyText } from '../lib/format';
import { MOODS, SINGERS, type MoodId, type SingerId, type Song } from '../lib/types';

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function AddSong({
  defaultSinger,
  onBack,
  onSave,
}: {
  defaultSinger: SingerId;
  onBack: () => void;
  onSave: (s: Song) => void;
}) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState(0);
  const [singers, setSingers] = useState<SingerId[]>([defaultSinger]);
  const [moods, setMoods] = useState<MoodId[]>([]);
  const [err, setErr] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr(true);
      return;
    }
    onSave({
      id: crypto.randomUUID(),
      title: title.trim(),
      artist: artist.trim(),
      key,
      singers: singers.length ? singers : ['insieme'],
      moods,
      lastSung: null,
      score: 0,
    });
  };

  return (
    <main className="screen screen--bar">
      <TopBar title="Nuova canzone" onBack={onBack} />
      <form className="form" onSubmit={save} noValidate>
        <label className="field">
          Titolo
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErr(false);
            }}
            placeholder="es. Azzurro"
            aria-invalid={err}
            aria-describedby={err ? 'title-err' : undefined}
          />
        </label>
        {err && (
          <p id="title-err" className="error">
            Scrivi almeno il titolo
          </p>
        )}
        <label className="field">
          Artista
          <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="es. Adriano Celentano" />
        </label>

        <div className="field">
          <span>Tonalità</span>
          <div className="stepper">
            <button type="button" className="glass" aria-label="Abbassa di un semitono" onClick={() => setKey(Math.max(-6, key - 1))}>
              <Icon name="minus" size={22} stroke={1.7} />
            </button>
            <span className="stepper__value" aria-live="polite">
              {keyText(key)}
            </span>
            <button type="button" className="glass" aria-label="Alza di un semitono" onClick={() => setKey(Math.min(6, key + 1))}>
              <Icon name="plus" size={22} stroke={1.7} />
            </button>
          </div>
        </div>

        <div className="field">
          <span>Chi la canta</span>
          <div className="chips">
            {SINGERS.map((o) => (
              <Chip key={o.id} big selected={singers.includes(o.id)} onClick={() => setSingers(toggle(singers, o.id))}>
                {o.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="field">
          <span>
            Mood <span className="muted optional">facoltativo</span>
          </span>
          <div className="chips">
            {MOODS.map((o) => (
              <Chip key={o.id} big selected={moods.includes(o.id)} onClick={() => setMoods(toggle(moods, o.id))}>
                {o.name}
              </Chip>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Salva canzone
        </button>
      </form>
    </main>
  );
}
