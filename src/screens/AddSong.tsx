import { useState } from 'react';
import { Chip, TopBar } from '../components/Chip';
import { Icon } from '../components/Icon';
import { daysSince, keyText, relDays } from '../lib/format';
import { withPeople } from '../lib/people';
import { MOODS, PEOPLE, type MoodId, type PersonId, type Song } from '../lib/types';

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** Modulo per una canzone: nuova (senza `initial`) o da modificare (con `initial`). */
export function AddSong({
  initial,
  defaultPeople,
  onBack,
  onSave,
}: {
  initial?: Song;
  /** Per una canzone nuova: le persone scelte in home. */
  defaultPeople: PersonId[];
  onBack: () => void;
  onSave: (s: Song) => void;
}) {
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [artist, setArtist] = useState(initial?.artist ?? '');
  const [key, setKey] = useState(initial?.key ?? 0);
  const startPeople = initial?.people ?? (defaultPeople.length ? defaultPeople : ['ester' as PersonId]);
  const [people, setPeople] = useState<PersonId[]>(startPeople);
  // Canzone nuova di una persona sola: la canta da sola. Di più persone: di base solo insieme.
  const [solo, setSolo] = useState<PersonId[]>(initial?.solo ?? (startPeople.length === 1 ? startPeople : []));
  const [moods, setMoods] = useState<MoodId[]>(initial?.moods ?? []);
  const [lastSung, setLastSung] = useState<string | null>(initial?.lastSung ?? null);
  const [err, setErr] = useState(false);
  const [peopleErr, setPeopleErr] = useState(false);

  const togglePerson = (p: PersonId) => {
    const next = toggle(people, p);
    setPeople(next);
    setPeopleErr(false);
    // Con una persona sola la canzone è per forza "da sola"; togliendo una persona si toglie anche dai solisti.
    setSolo(next.length === 1 ? next : solo.filter((x) => next.includes(x)));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) setErr(true);
    if (people.length === 0) setPeopleErr(true);
    if (!title.trim() || people.length === 0) return;
    onSave(
      withPeople(
        {
          id: initial?.id ?? crypto.randomUUID(),
          title: title.trim(),
          artist: artist.trim(),
          key,
          moods,
          lastSung,
          score: initial?.score ?? 0,
        },
        people,
        people.length === 1 ? people : solo,
      ),
    );
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
          <span id="who-label">Chi la canta</span>
          <div className="chips" role="group" aria-labelledby="who-label">
            {PEOPLE.map((o) => (
              <Chip key={o.id} big selected={people.includes(o.id)} onClick={() => togglePerson(o.id)}>
                {o.name}
              </Chip>
            ))}
          </div>
          {peopleErr && <p className="error error--inline">Scegli almeno una persona</p>}
        </div>

        {people.length > 1 && (
          <div className="field">
            <span id="solo-label">
              Chi la canta anche da solo/a?{' '}
              <span className="muted optional">nessuno = solo insieme</span>
            </span>
            <div className="chips" role="group" aria-labelledby="solo-label">
              {PEOPLE.filter((o) => people.includes(o.id)).map((o) => (
                <Chip key={o.id} big selected={solo.includes(o.id)} onClick={() => setSolo(toggle(solo, o.id))}>
                  {o.name}
                </Chip>
              ))}
            </div>
            <p className="muted small hint">
              {solo.length === 0
                ? 'Esce solo quando scegli tutte queste persone insieme.'
                : `Esce anche quando scegli solo ${solo.map((p) => PEOPLE.find((x) => x.id === p)?.name).join(' o ')}.`}
            </p>
          </div>
        )}

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
