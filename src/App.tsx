import { useCallback, useEffect, useRef, useState } from 'react';
import { draw } from './lib/draw';
import { today } from './lib/format';
import { mergeSongs } from './lib/merge';
import { loadNight, loadSongs, loadTheme, saveNight, saveSongs, saveTheme, type Theme } from './lib/storage';
import { getCode, setCode as storeCode, signature, syncSongs, type SyncStatus } from './lib/sync';
import type { MoodId, SingerId, Song } from './lib/types';
import { Home } from './screens/Home';
import { Draw, type DrawPhase } from './screens/Draw';
import { SongList } from './screens/SongList';
import { AddSong } from './screens/AddSong';
import { SyncSettings } from './screens/SyncSettings';

type Screen = 'home' | 'draw' | 'list' | 'add' | 'sync';

/** Ogni quanto ricontrollare le novità dall'altro telefono, con l'app aperta. */
const POLL_MS = 60_000;

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

  // ---- sync ----
  const [code, setCode] = useState(getCode);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getCode() ? 'syncing' : 'off');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const songsRef = useRef(songs);
  songsRef.current = songs;
  const syncedSig = useRef<string | null>(null);
  const inFlight = useRef(false);

  const runSync = useCallback(async () => {
    if (!code || inFlight.current) return;
    inFlight.current = true;
    setSyncStatus('syncing');
    const sent = songsRef.current;
    const r = await syncSongs(sent, code);
    inFlight.current = false;
    setSyncStatus(r.status);
    if (r.status !== 'ok' || !r.songs) return;
    setLastSync(Date.now());
    const serverSongs = r.songs;
    syncedSig.current = signature(serverSongs);
    // Unisco anche con quello che è cambiato sul telefono mentre la richiesta era in viaggio.
    setSongs((local) => {
      const merged = mergeSongs(local, serverSongs);
      return signature(merged) === signature(local) ? local : merged;
    });
  }, [code]);

  // Dopo ogni modifica locale: sync (con una piccola attesa per raggruppare i tocchi).
  useEffect(() => {
    if (!code || signature(songs) === syncedSig.current) return;
    const t = window.setTimeout(runSync, 1200);
    return () => window.clearTimeout(t);
  }, [songs, code, runSync]);

  // All'apertura, quando torna la rete, quando si torna sull'app, e ogni minuto.
  useEffect(() => {
    if (!code) return;
    runSync();
    const onVisible = () => document.visibilityState === 'visible' && runSync();
    window.addEventListener('online', runSync);
    document.addEventListener('visibilitychange', onVisible);
    const iv = window.setInterval(() => document.visibilityState === 'visible' && runSync(), POLL_MS);
    return () => {
      window.removeEventListener('online', runSync);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(iv);
    };
  }, [code, runSync]);

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

  const touch = (s: Song, patch: Partial<Song>): Song => ({ ...s, ...patch, updatedAt: Date.now() });

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
    setSongs(songs.map((s) => (s.id === cur ? touch(s, { lastSung: today(), score: s.score + 1 }) : s)));
    setNight((x) => ({ ...x, seen: [...x.seen, cur] }));
    setPhase('done');
  };

  const skip = () => {
    if (!cur) return;
    const next = songs.map((s) => (s.id === cur ? touch(s, { score: s.score - 1 }) : s));
    setSongs(next);
    doDraw(next, [...night.seen, cur], night.draws);
  };

  const addSong = (song: Song) => {
    setSongs((list) => [...list, { ...song, updatedAt: Date.now() }]);
    setScreen('list');
    showToast(`Aggiunta: ${song.title}`);
  };

  const saveCode = (c: string) => {
    storeCode(c);
    syncedSig.current = null;
    setCode(c);
    setSyncStatus(c ? 'syncing' : 'off');
    showToast(c ? 'Codice salvato' : 'Sync disattivata');
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
          syncStatus={syncStatus}
          onSync={() => setScreen('sync')}
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

      {screen === 'sync' && (
        <SyncSettings
          code={code}
          status={syncStatus}
          lastSync={lastSync}
          onSaveCode={saveCode}
          onSyncNow={runSync}
          onBack={() => setScreen('home')}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
