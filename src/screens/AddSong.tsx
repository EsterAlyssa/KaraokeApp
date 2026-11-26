import { useState } from 'react';
import { Chip, TopBar } from '../components/Chip';
import { Icon } from '../components/Icon';
import { daysSince, keyText, relDays } from '../lib/format';
import { MOODS, SINGERS, type MoodId, type SingerId, type Song } from '../lib/types';

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** Modulo per una canzone: nuova (senza `initial`) o da modificare (con `initial`). */
export function AddSong({
  initial,
  defaultSinger,
  onBack,
  onSave,
}: {
  initial?: Song;
  defaultSinger: SingerId;
  onBack: () => void;
  onSave: (s: Song) => void;
}) {
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [artist, setArtist] = useState(initial?.artist ?? '');
  const [key, setKey] = useState(initial?.key ?? 0);
  const [singers, setSingers] = useState<SingerId[]>(initial?.singers ?? [defaultSinger]);
  const [moods, setMoods] = useState<MoodId[]>(initial?.moods ?? []);
  const [lastSung, setLastSung] = useState<string | null>(initial?.lastSung ?? null);
  const [err, setErr] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr(true);
      return;
    }
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      artist: artist.trim(),
      key,
      singers: singers.length ? singers : ['insieme'],
      moods,
      lastSung,
      score: initial?.score ?? 0,
    });
  };

  return (
    <main className="screen screen--bar">
      <TopBar title={editing ? 'Modifica canzone' : 'Nuova canzone'} onBack={onBack} />
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
            <button type="button" className="glass" aria-label="Abbassa di un semitono" onClick={() => setKey(Math.max(-12, key - 1))}>
              <Icon name="minus" size={22} stroke={1.7} />
            </button>
            <span className="stepper__value" aria-live="polite">
              {keyText(key)}
            </span>
            <button type="button" className="glass" aria-label="Alza di un semitono" onClick={() => setKey(Math.min(12, key + 1))}>
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

        {editing && (
          <div className="field">
            <span>Ultima volta cantata</span>
            <div className="last-row">
              <span className="muted body">{relDays(daysSince(lastSung))}</span>
              {lastSung && (
                <button type="button" className="chip" onClick={() => setLastSung(null)}>
                  Segna come mai cantata
                </button>
              )}
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary">
          {editing ? 'Salva modifiche' : 'Salva canzone'}
        </button>
      </form>
    </main>
  );
}
