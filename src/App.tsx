import { useCallback, useEffect, useRef, useState } from 'react';
import { draw } from './lib/draw';
import { today } from './lib/format';
import { loadNight, loadSongs, loadTheme, saveNight, saveSongs, saveTheme, type Theme } from './lib/storage';
import type { MoodId, SingerId, Song } from './lib/types';
import { Home } from './screens/Home';
import { Draw, type DrawPhase } from './screens/Draw';
import { SongList } from './screens/SongList';
import { AddSong } from './screens/AddSong';

type Screen = 'home' | 'draw' | 'list' | 'add';

export default function App() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [songs, setSongs] = useState<Song[]>(loadSongs);
  const [night, setNight] = useState(loadNight);
  const [screen, setScreen] = useState<Screen>('home');
  const [singer, setSinger] = useState<SingerId>('insieme');
  const [moods, setMoods] = useState<MoodId[]>([]);
  const [cur, setCur] = useState<string | null>(null);
  const [isOld, setIsOld] = useState(false);
  const [phase, setPhase] = useState<DrawPhase>('card');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);
  useEffect(() => saveSongs(songs), [songs]);
  useEffect(() => saveNight(night), [night]);

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const doDraw = (list: Song[], seen: string[], draws: number) => {
    const n = draws + 1;
    const r = draw(list, { singer, moods, serata: night.serata, seen }, n, cur);
    setScreen('draw');
    if (!r) {
      setPhase('empty');
      setNight((x) => ({ ...x, seen }));
      return;
    }
    setCur(r.song.id);
    setIsOld(r.isOld);
    setPhase('card');
    setNight((x) => ({ ...x, seen, draws: n }));
  };

  const startDraw = () => doDraw(songs, night.seen, night.draws);

  const sing = () => {
    if (!cur) return;
    const next = songs.map((s) => (s.id === cur ? { ...s, lastSung: today(), score: s.score + 1 } : s));
    setSongs(next);
    setNight((x) => ({ ...x, seen: [...x.seen, cur] }));
    setPhase('done');
  };

  const skip = () => {
    if (!cur) return;
    const next = songs.map((s) => (s.id === cur ? { ...s, score: s.score - 1 } : s));
    setSongs(next);
    doDraw(next, [...night.seen, cur], night.draws);
  };

  const addSong = (song: Song) => {
    setSongs((list) => [...list, song]);
    setScreen('list');
    showToast(`Aggiunta: ${song.title}`);
  };

  const current = songs.find((s) => s.id === cur) ?? null;

  return (
    <div className="app">
      <div className="blob blob--1" aria-hidden="true" />
      <div className="blob blob--2" aria-hidden="true" />

      {screen === 'home' && (
        <Home
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'night' ? 'day' : 'night'))}
          songs={songs}
          singer={singer}
          onSinger={setSinger}
          moods={moods}
          onMoods={setMoods}
          onDraw={startDraw}
          onList={() => setScreen('list')}
          onAdd={() => setScreen('add')}
        />
      )}

      {screen === 'draw' && (
        <Draw
          song={current}
          phase={phase}
          isOld={isOld}
          draws={night.draws}
          serata={night.serata}
          onToggleSerata={() => {
            const on = !night.serata;
            setNight((x) => ({ ...x, serata: on }));
            showToast(on ? 'Stasera niente ripetizioni' : 'Ripetizioni permesse');
          }}
          onSing={sing}
          onSkip={skip}
          onNext={startDraw}
          onRestart={() => doDraw(songs, [], night.draws)}
          onHome={() => setScreen('home')}
        />
      )}

      {screen === 'list' && <SongList songs={songs} onBack={() => setScreen('home')} onAdd={() => setScreen('add')} />}

      {screen === 'add' && <AddSong defaultSinger={singer} onBack={() => setScreen('home')} onSave={addSong} />}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
