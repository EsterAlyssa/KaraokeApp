# KaraokeApp — memoria del progetto

> Questo file è la memoria condivisa del progetto. Claude lo legge automaticamente
> all'inizio di ogni sessione aperta in questa cartella.
> **Regola:** ogni volta che si prende una decisione nuova (design, funzionalità,
> tecnologia), aggiornare questo file nella stessa sessione, così resta sempre attuale.

## Come resta aggiornata questa memoria
La fonte unica è questo file su GitHub (`EsterAlyssa/KaraokeApp`, branch `main`).
Ci si lavora da più posti: il computer (Claude Code / Cowork sulla cartella
`C:\Users\eadin\Desktop\KaraokeApp`) e il telefono (Claude Code sul web, che clona
il repository) anche quando il computer è spento.

- **All'inizio di ogni sessione:** `git pull` per prendere le modifiche fatte altrove.
- **Dopo ogni modifica a questo file** (o al codice): commit e **push subito**, nella
  stessa sessione. Una modifica non pushata non esiste per gli altri dispositivi.
- Non tenere decisioni in memorie separate (note del progetto, memorie locali):
  vanno scritte qui.
- In caso di conflitto con una modifica fatta da un altro dispositivo: unire le due
  versioni tenendo entrambe le decisioni, non sovrascrivere.

## Cos'è
Una PWA (web app installabile sul telefono) per le serate karaoke in casa di
**Ester e la mamma**. L'app "pesca" la prossima canzone da cantare tenendo conto
di chi canta, dell'atmosfera e di cosa si è cantato di recente.

- Lingua dell'interfaccia: **italiano**.
- Repository: https://github.com/EsterAlyssa/KaraokeApp (branch `main`).

## Dove stanno le cose
| Cosa | Dove |
|---|---|
| Mockup interattivo (canvas Design) | https://claude.ai/artifact/MRqQUyhtPGPqzRv4C3xhd5 — artboard `Main.dc.html` (tema giorno) e `Notte.dc.html` (tema notte), 390×844 |
| Tema colori Material (export Material Theme Builder, seed `#A8EBF1`) | `design/material-theme.json` |
| Token colore per Penpot (palette tonali + schemi) | `design/penpot-tokens.json` |
| Canzoni originali (fonte dell'import) | Notion › Karaoke › *Con mamma*, *Mie*, *Solo mamma*, *Di gruppo* (*Vale* esclusa) |
| App online (Vercel) | progetto `karaoke-di-casa` nel team *esteralyssas-projects*, collegato a GitHub: **ogni push su `main` pubblica da solo** |

Il mockup è il riferimento per l'aspetto; il comportamento vero ora sta nel codice.

## Codice
Stack: **Vite + React + TypeScript**, PWA con `vite-plugin-pwa` (offline + installabile),
font inclusi con `@fontsource` (Atkinson Hyperlegible per il testo, Lora per i titoli).

```
design/                 tema Material e token Penpot (fonte dei colori)
scripts/gen-theme.mjs   design/material-theme.json -> src/styles/theme.css  (npm run theme)
scripts/notion-import.mjs  liste Notion -> src/data/seed.json             (npm run seed)
public/                 favicon.svg + icone PWA generate (npm run icons)
api/sync.ts             funzione Vercel POST /api/sync (unisce e salva su Vercel Blob)
src/lib/                types, format (date/testi), draw (regole di pesca), storage (localStorage),
                        merge (regola di unione, usata da app e server), sync (chiamate a /api/sync)
src/screens/            Home, Draw (pescata), SongList, AddSong, SyncSettings
src/components/         Icon, Chip, TopBar
src/styles/             theme.css (GENERATO, non toccare) + app.css
```

Comandi: `npm install`, `npm run dev` (http://localhost:5173), `npm run build`.

- **Colori:** mai a mano in `theme.css`. Si cambia `design/material-theme.json` e si lancia
  `npm run theme`. Le sfumature (vetro, ombre, sfondi) sono derivate in `app.css` con `color-mix`.
- **Dati:** salvati sul telefono in localStorage (`karaoke.songs.v1`). Al primo avvio si
  parte da `src/data/seed.json`. L'app funziona sempre offline; la sync è un di più.
- **Sync tra i telefoni:**
  - Server: `api/sync.ts` su Vercel. Salva tutte le canzoni in un unico file JSON
    (`karaoke/songs.json`) nel Blob store **privato** `karaoke-canzoni` (team esteralyssas-projects,
    regione iad1). Variabile `BLOB_READ_WRITE_TOKEN` creata da Vercel.
  - Protezione: header `x-family-code` confrontato con la variabile **`FAMILY_CODE`** su Vercel
    (maiuscole/minuscole non contano). Senza `FAMILY_CODE` l'API risponde 503 "not_configured".
    Il codice lo sceglie Ester e lo imposta lei su Vercel: Claude non lo legge né lo scrive.
  - Unione: canzone per canzone vince la modifica più recente (`updatedAt`); le canzoni nuove
    si sommano. Scrittura con `ifMatch` (ETag): se l'altro telefono ha salvato nel frattempo,
    il server rilegge e riunisce (fino a 4 tentativi).
  - Quando: dopo ogni modifica (1,2 s di attesa), all'apertura, al ritorno della rete,
    quando si torna sull'app e ogni minuto con l'app aperta.
  - Codice famiglia sul telefono in `karaoke.family.v1`; pallino di stato sul pulsante nuvola in home.
  - Limite noto: se tutti e due i telefoni cambiano la *stessa* canzone offline, resta la modifica
    più recente (es. un +1 al gradimento può perdersi). Per due persone va bene.
- **Serata:** `karaoke.serata.v1` vale solo per il giorno corrente (canzoni viste, n. pescate);
  il giorno dopo si riparte da zero.
- **Tema:** giorno/notte; al primo avvio segue il tema del telefono, poi ricorda la scelta.

## Schermate (dal mockup)
1. **Home** — "Chi canta?" (Ester · Mamma · Insieme), "Che atmosfera?" (mood multipli),
   pulsante **Pesca**, interruttore tema sole/luna.
2. **Pescata** — card della canzone (titolo, artista, tonalità, ultima volta cantata,
   chi canta). Swipe/pulsanti: *Si canta!* oppure scarta e *Pesca la prossima*.
   Stato vuoto: "Finite le canzoni" → *Cambia filtri* / *Ricomincia la serata*.
3. **Le canzoni** — elenco con ricerca, filtri (cantante, mood, "mai cantata") e
   ordinamento (da più tempo / più recenti / A–Z).
4. **Nuova canzone** — titolo, artista, tonalità, chi la canta, mood → *Salva canzone*.

## Modello dati di una canzone
```
{ id,       // stringa (slug del titolo per le canzoni importate, UUID per le nuove)
  title, artist,
  key,      // tonalità: intero rispetto all'originale (0 = Originale, −2, +1…)
  singers,  // ['ester' | 'mamma' | 'insieme']
  moods,    // ['allegra' | 'ballare' | 'gruppo']
  lastSung, // data ultima volta cantata 'YYYY-MM-DD', null = mai cantata
  score,    // gradimento: +1 quando si canta, −1 quando si scarta
  updatedAt } // ms dell'ultima modifica (0/assente = mai toccata); decide chi vince nella sync
```

## Regole di pesca (decise)
- Filtra per cantante scelto; i **mood si combinano in OR** (basta che la canzone ne abbia uno).
- **Insieme** = canzoni da cantare in due.
- **Modalità serata** attiva di default: niente ripetizioni nella stessa serata
  (cantate e scartate non tornano).
- Pescata casuale pesata: peso = `max(0.5, 3 + score) × (1 + min(giorni, 90) / 30)`.
- **Ogni 5ª pescata**: la canzone non cantata da più tempo (le "mai cantate" per prime).
- Non ripescare subito la stessa canzone appena mostrata.

## Design
- Tema **Material** (seed `#A8EBF1`, verde acqua), giorno = schema light, notte = schema dark.
  Il mockup usava una palette indaco provvisoria: nell'app è già sostituita.
- Layout, forme (vetro, card che si trascina, pulsante Pesca grande) e testi come nel mockup.
- Mobile first, target touch ≥ 44px, testi accessibili (contrasto ≥ 4.5:1).

## Da fare / decisioni aperte
- [x] Stack e prima versione della PWA.
- [x] Dati **offline** sul telefono (localStorage).
- [x] Tema Material al posto della palette provvisoria.
- [x] Canzoni importate da Notion (133).
- [x] Hosting su **Vercel** (deploy automatico da GitHub).
- [x] **Sync gratuita** tra i 2 telefoni (Vercel Blob privato + codice famiglia).
- [ ] Impostare `FAMILY_CODE` su Vercel e inserire lo stesso codice sui due telefoni.
- [ ] Modificare / eliminare una canzone dalla lista (nel mockup non c'era).
- [ ] Assegnare i mood alle canzoni importate (da Notion arriva solo "Di gruppo").
- [ ] Sistemare i refusi nei titoli/artisti presi da Notion (es. "Che to dico a fa",
      "Ossesione", "Comacose", "Boombadash", "Malika Ayanne"): importati tali e quali.

## Registro decisioni
- 2026-11-23 — Creato il tema Material (seed `#A8EBF1`) e i token Penpot.
- 2026-11-26 — Mockup interattivo con tema giorno/notte e regole di pesca sopra.
- 2026-11-26 — Collegata la cartella locale al repository GitHub; creata questa memoria.
- 2026-11-26 — Regola di sync: `git pull` a inizio sessione, commit + push dopo ogni modifica (accesso anche da telefono a computer spento).
- 2026-11-26 — Prima versione della PWA: Vite + React + TS, tema Material, dati offline,
  133 canzoni da Notion (Con mamma → Insieme, Mie → Ester, Solo mamma → Mamma,
  Di gruppo → Insieme + mood "Di gruppo"; doppioni uniti per titolo). File di tema spostati in `design/`.
- 2026-11-27 — Pubblicata su Vercel (progetto `karaoke-di-casa`), deploy automatico a ogni push su `main`.
  Nessun database per ora: i dati stanno su ogni telefono; la sync è il prossimo passo.
- 2026-11-27 — Sync tra i telefoni: Vercel Blob privato `karaoke-canzoni` (gratuito, già collegato
  al progetto), API `/api/sync`, protezione con codice famiglia (`FAMILY_CODE`), unione per canzone
  con "vince la più recente". Scartati: Upstash/Neon (servono passaggi in più dal Marketplace)
  e Blob pubblico (cache CDN, letture non aggiornate).
- 2026-11-27 — Ambiente cloud per Claude Code sul web: da creare su claude.ai/code
  (nome KaraokeApp, script di setup `npm install`).
