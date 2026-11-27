import { useCallback, useEffect, useRef, useState } from 'react';
import { draw } from './lib/draw';
import { today } from './lib/format';
import { mergeSongs } from './lib/merge';
import { markSeen, mergeNight, nightSignature, restartNight, seenIds, type NightState } from './lib/night';
import {
  loadNight,
  loadOnlyOriginal,
  loadSongs,
  loadTheme,
  saveNight,
  saveOnlyOriginal,
  saveSongs,
  saveTheme,
  type Theme,
} from './lib/storage';
import { getCode, setCode as storeCode, signature, syncAll, type SyncStatus } from './lib/sync';
import { normalizeSong } from './lib/people';
import type { MoodId, PersonId, Song } from './lib/types';
import { Home } from './screens/Home';
import { Draw, type DrawPhase } from './screens/Draw';
import { SongList } from './screens/SongList';
import { AddSong } from './screens/AddSong';
import { SyncSettings } from './screens/SyncSettings';

type Screen = 'home' | 'draw' | 'list' | 'add' | 'edit' | 'sync';

/** Ogni quanto ricontrollare le novità dall'altro telefono, con l'app aperta. */
const POLL_MS = 60_000;

export default function App() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [songs, setSongs] = useState<Song[]>(loadSongs);
  const [night, setNight] = useState(loadNight);
  const [screen, setScreen] = useState<Screen>('home');
  const [people, setPeople] = useState<PersonId[]>(['ester', 'mamma']);
  const [moods, setMoods] = useState<MoodId[]>([]);
  const [onlyOriginal, setOnlyOriginal] = useState(loadOnlyOriginal);
  const [cur, setCur] = useState<string | null>(null);
  const [isOld, setIsOld] = useState(false);
  const [phase, setPhase] = useState<DrawPhase>('card');
  const [toast, setToast] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // ---- sync ----
  const [code, setCode] = useState(getCode);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getCode() ? 'syncing' : 'off');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncDetail, setSyncDetail] = useState('');
  const songsRef = useRef(songs);
  songsRef.current = songs;
  const nightRef = useRef(night);
  nightRef.current = night;
  /** Firma di tutto ciò che si sincronizza: canzoni + serata. */
  const fullSig = (list: Song[], n: NightState) => `${signature(list)}#${nightSignature(n)}`;
  const syncedSig = useRef<string | null>(null);
  const inFlight = useRef(false);

  const runSync = useCallback(async () => {
    if (!code || inFlight.current) return;
    inFlight.current = true;
    setSyncStatus('syncing');
    const r = await syncAll(songsRef.current, nightRef.current, code);
    inFlight.current = false;
    setSyncStatus(r.status);
    setSyncDetail(r.detail ?? '');
    if (r.status !== 'ok' || !r.songs) return;
    setLastSync(Date.now());
    const serverSongs = r.songs.map(normalizeSong);
    const serverNight = r.night;
    if (serverNight) syncedSig.current = fullSig(serverSongs, serverNight);
    // Unisco anche con quello che è cambiato sul telefono mentre la richiesta era in viaggio.
    setSongs((local) => {
      const merged = mergeSongs(local, serverSongs);
      return signature(merged) === signature(local) ? local : merged;
    });
    if (serverNight) {
      setNight((local) => {
        const merged = mergeNight(local, serverNight);
        return nightSignature(merged) === nightSignature(local) ? local : merged;
      });
    }
  }, [code]);

  // Dopo ogni modifica locale: sync (con una piccola attesa per raggruppare i tocchi).
  useEffect(() => {
    if (!code || fullSig(songs, night) === syncedSig.current) return;
    const t = window.setTimeout(runSync, 1200);
    return () => window.clearTimeout(t);
  }, [songs, night, code, runSync]);

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
  useEffect(() => saveOnlyOriginal(onlyOriginal), [onlyOriginal]);

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const touch = (s: Song, patch: Partial<Song>): Song => ({ ...s, ...patch, updatedAt: Date.now() });

  /** Pesca con la serata `n` (già aggiornata con l'ultima canzone vista, se serve). */
  const doDraw = (list: Song[], n: NightState) => {
    const num = n.draws + 1;
    const r = draw(list, { people, moods, onlyOriginal, serata: n.serata, seen: seenIds(n) }, num, cur);
    setScreen('draw');
    if (!r) {
      setPhase('empty');
      setNight(n);
      return;
    }
    setCur(r.song.id);
    setIsOld(r.isOld);
    setPhase('card');
    setNight({ ...n, draws: num });
  };

  const startDraw = () => doDraw(songs, night);

  const sing = () => {
    if (!cur) return;
    setSongs(songs.map((s) => (s.id === cur ? touch(s, { lastSung: today(), score: s.score + 1 }) : s)));
    setNight((x) => markSeen(x, cur));
    setPhase('done');
  };

  const skip = () => {
    if (!cur) return;
    const next = songs.map((s) => (s.id === cur ? touch(s, { score: s.score - 1 }) : s));
    setSongs(next);
    doDraw(next, markSeen(night, cur));
  };

  const addSong = (song: Song) => {
    setSongs((list) => [...list, { ...song, updatedAt: Date.now() }]);
    setScreen('list');
    showToast(`Aggiunta: ${song.title}`);
  };

  const editSong = (song: Song) => {
    setSongs((list) => list.map((s) => (s.id === song.id ? { ...song, updatedAt: Date.now() } : s)));
    setScreen('list');
    showToast(`Modificata: ${song.title}`);
  };

  const saveCode = (c: string) => {
    storeCode(c);
    syncedSig.current = null;
    setCode(c);
    setSyncStatus(c ? 'syncing' : 'off');
    showToast(c ? 'Codice salvato' : 'Sync disattivata');
  };

  const current = songs.find((s) => s.id === cur) ?? null;
  const editing = songs.find((s) => s.id === editId) ?? null;

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
          people={people}
          onPeople={setPeople}
          moods={moods}
          onMoods={setMoods}
          onlyOriginal={onlyOriginal}
          onOnlyOriginal={setOnlyOriginal}
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
            setNight((x) => ({ ...x, serata: on, serataAt: Date.now() }));
            showToast(on ? 'Stasera niente ripetizioni' : 'Ripetizioni permesse');
          }}
          onSing={sing}
          onSkip={skip}
          onNext={startDraw}
          onRestart={() => doDraw(songs, restartNight(night))}
          onHome={() => setScreen('home')}
        />
      )}

      {screen === 'list' && (
        <SongList
          songs={songs}
          onBack={() => setScreen('home')}
          onAdd={() => setScreen('add')}
          onEdit={(id) => {
            setEditId(id);
            setScreen('edit');
          }}
        />
      )}

      {screen === 'edit' && editing && (
        <AddSong
          key={editing.id}
          initial={editing}
          defaultPeople={people}
          onBack={() => setScreen('list')}
          onSave={editSong}
        />
      )}

      {screen === 'add' && <AddSong defaultPeople={people} onBack={() => setScreen('home')} onSave={addSong} />}

      {screen === 'sync' && (
        <SyncSettings
          code={code}
          status={syncStatus}
          lastSync={lastSync}
          detail={syncDetail}
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
