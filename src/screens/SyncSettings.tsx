import { useState } from 'react';
import { TopBar } from '../components/Chip';
import { statusText, type SyncStatus } from '../lib/sync';

export function SyncSettings({
  code,
  status,
  lastSync,
  onSaveCode,
  onSyncNow,
  onBack,
}: {
  code: string;
  status: SyncStatus;
  lastSync: number | null;
  onSaveCode: (code: string) => void;
  onSyncNow: () => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState(code);
  const time = lastSync
    ? new Date(lastSync).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <main className="screen screen--bar">
      <TopBar title="Sincronizza" onBack={onBack} />
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSaveCode(value.trim());
        }}
      >
        <p className="muted body">
          Con lo stesso codice famiglia, il tuo telefono e quello della mamma vedono le stesse canzoni: quelle
          cantate, scartate e aggiunte. Senza rete l'app funziona lo stesso e si mette in pari dopo.
        </p>

        <label className="field">
          Codice famiglia
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Lo stesso su tutti e due i telefoni"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className={`sync-status sync-status--${status}`} role="status">
          <span className="sync-dot" aria-hidden="true" />
          <span>
            {statusText[status]}
            {status === 'ok' && time ? ` alle ${time}` : ''}
          </span>
        </div>

        <button type="submit" className="btn-primary">
          Salva codice
        </button>
        {code && (
          <button type="button" className="btn-glass" onClick={onSyncNow}>
            Sincronizza ora
          </button>
        )}
      </form>
    </main>
  );
}
