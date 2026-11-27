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
| Canzoni originali (fonte dell'import) | Notion › Karaoke › *Con mamma*, *Mie*, *Solo mamma*, *Di gruppo*, *Vale* + liste vecchie incollate da Ester (duetti con la mamma, solo sue, "Mamma", "Papà"): tutto in `scripts/notion-import.mjs`. |
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
                        merge (unione canzoni) e night (serata + sua unione), usati da app e server,
                        sync (chiamate a /api/sync)
src/screens/            Home, Draw (pescata), SongList, AddSong, SyncSettings
src/components/         Icon, Chip, TopBar
src/styles/             theme.css (GENERATO, non toccare) + app.css
```

Comandi: `npm install`, `npm run dev` (http://localhost:5173), `npm run build`.

- **Colori:** mai a mano in `theme.css`. Si cambia `design/material-theme.json` e si lancia
  `npm run theme`. Le sfumature (vetro, ombre, sfondi) sono derivate in `app.css` con `color-mix`.
- **Dati:** salvati sul telefono in localStorage (`karaoke.songs.v1`). Al primo avvio si
  parte da `src/data/seed.json`. L'app funziona sempre offline; la sync è un di più.
- **Aggiungere canzoni al seed** (es. nuove liste): modificare `scripts/notion-import.mjs`, `npm run seed`,
  e **aumentare `SEED_VERSION`** in `src/lib/storage.ts`. All'apertura i telefoni già in uso ricevono le
  canzoni nuove (`applySeed`, con `updatedAt` aggiornato così la sync le propaga). Canzoni **mai toccate**
  sul telefono (senza `updatedAt`): prendono la versione del seed (tonalità e cantanti corretti arrivano).
  Canzoni già cantate/modificate: si aggiungono solo cantanti/mood nuovi; titolo, tonalità, date e
  gradimento del telefono non vengono toccati.
- **Sync tra i telefoni:**
  - Server: `api/sync.ts` su Vercel. Nel Blob store **privato** `karaoke-canzoni` (team
    esteralyssas-projects, regione iad1) salva due file JSON: `karaoke/songs.json` (canzoni) e
    `karaoke/night.json` (serata condivisa). Variabile `BLOB_READ_WRITE_TOKEN` creata da Vercel.
  - Richiesta: `{ code, songs, night? }` → risposta `{ songs, night? }` (la serata è facoltativa
    per compatibilità con versioni vecchie dell'app).
  - Protezione: campo `code` nel corpo JSON confrontato con la variabile **`FAMILY_CODE`** su Vercel
    (spazi ai lati e maiuscole non contano, normalizzazione NFC). **Non usare un header** per il codice:
    gli header non accettano lettere accentate e la richiesta fallisce sul telefono. L'header
    `x-family-code` è accettato solo per compatibilità. Senza `FAMILY_CODE` l'API risponde 503 "not_configured".
    Il codice lo sceglie Ester e lo imposta lei su Vercel (segnato "sensitive"): Claude non lo legge né lo scrive.
  - Variabile impostata dall'utente su Vercel: serve un **redeploy** perché valga.
  - Errori: il server scrive `[sync] …` nei log Vercel (Hobby li tiene 1 ora); la schermata
    Sincronizza mostra "Dettaglio: <status> <errore>". Se l'ETag non torna dopo 4 tentativi,
    il server rilegge, riunisce e salva senza controllo.
  - Unione: canzone per canzone vince la modifica più recente (`updatedAt`); le canzoni nuove
    si sommano. Scrittura con `ifMatch` (ETag): se l'altro telefono ha salvato nel frattempo,
    il server rilegge e riunisce (fino a 4 tentativi).
  - Quando: dopo ogni modifica (1,2 s di attesa), all'apertura, al ritorno della rete,
    quando si torna sull'app e ogni minuto con l'app aperta.
  - Codice famiglia sul telefono in `karaoke.family.v1`; pallino di stato sul pulsante nuvola in home.
  - Limite noto: se tutti e due i telefoni cambiano la *stessa* canzone offline, resta la modifica
    più recente (es. un +1 al gradimento può perdersi). Per due persone va bene.
- **Serata (condivisa tra i telefoni):** `karaoke.serata.v1`, vale solo per il giorno corrente.
  Forma: `{ date, seen: {id: ms}, resetAt, draws, serata, serataAt }` (`src/lib/night.ts`).
  Unione: stesso giorno → canzoni viste sommate (tranne quelle viste prima dell'ultimo
  "Ricomincia la serata", `resetAt`), pescate = il numero più alto, interruttore serata = scelta
  più recente (`serataAt`); giorni diversi → vale la serata più recente. Il vecchio formato
  (`seen` come elenco) viene convertito all'apertura. La canzone mostrata sulla card non è condivisa:
  ogni telefono pesca la sua.
- **Tema:** giorno/notte; al primo avvio segue il tema del telefono, poi ricorda la scelta.

## Schermate (dal mockup)
1. **Home** — "Chi canta?" (bollini Ester · Mamma · Papà · Vale, anche più insieme), "Che atmosfera?" (mood multipli),
   interruttore **"Solo tonalità originale"**, pulsante **Pesca**, pulsanti sync (nuvola) e tema sole/luna.
2. **Pescata** — card della canzone (titolo, artista, tonalità, ultima volta cantata,
   chi canta). Swipe/pulsanti: *Si canta!* oppure scarta e *Pesca la prossima*.
   Stato vuoto: "Finite le canzoni" → *Cambia filtri* / *Ricomincia la serata*.
3. **Le canzoni** — elenco con ricerca, filtri (cantante, mood, "mai cantata") e
   ordinamento (da più tempo / più recenti / A–Z).
4. **Nuova canzone** — titolo, artista, tonalità, chi la canta, mood → *Salva canzone*.
5. **Modifica canzone** — si apre toccando una canzone in *Le canzoni*; stesso modulo già compilato,
   in più "Segna come mai cantata". Tonalità da −12 a +12.
6. **Sincronizza** — pulsante nuvola in home: codice famiglia e stato della sync.

## Modello dati di una canzone
```
{ id,       // stringa (slug del titolo per le canzoni importate, UUID per le nuove)
  title, artist,
  key,      // tonalità: intero rispetto all'originale (0 = Originale, −2, +1…)
  singers,  // chi la può cantare, una o più voci tra:
            // 'ester' | 'mamma' | 'papa'                         (da soli)
            // 'insieme' (Ester+mamma) | 'vale' (Ester+Vale)       (id storici, non rinominare: dati già sincronizzati)
            // 'ester_papa' (Ester+papà) | 'papa_mamma' (papà+mamma)
  moods,    // ['allegra' | 'ballare' | 'gruppo']
  lastSung, // data ultima volta cantata 'YYYY-MM-DD', null = mai cantata
  score,    // gradimento: +1 quando si canta, −1 quando si scarta
  updatedAt } // ms dell'ultima modifica (0/assente = mai toccata); decide chi vince nella sync
```

## Regole di pesca (decise)
- **"Chi canta?" = persone, non combinazioni**: 4 bollini (`PEOPLE`: Ester, Mamma, Papà, Vale) che si
  accendono anche insieme. `singerFor(persone)` trova la combinazione in `SINGERS` (es. Ester+Mamma →
  'insieme', "Ester e mamma"); il nome compare accanto al titolo. Combinazione senza canzoni (es. Vale da
  sola, tre persone) → "Nessuna canzone per questa combinazione" e Pesca disattivato. Per aggiungere una
  coppia nuova basta una riga in `SINGERS`. Default all'apertura: Ester + Mamma.
- Filtra per la combinazione scelta; i **mood si combinano in OR** (basta che la canzone ne abbia uno).
- I bollini si stringono in altezza e in larghezza: con 4 persone la home sta ancora in 375×600.
- **Modalità serata** attiva di default: niente ripetizioni nella stessa serata
  (cantate e scartate non tornano).
- Pescata casuale pesata: peso = `max(0.5, 3 + score) × (1 + min(giorni, 90) / 30)`.
- **Ogni 5ª pescata**: la canzone non cantata da più tempo (le "mai cantate" per prime).
- Non ripescare subito la stessa canzone appena mostrata.
- **Solo tonalità originale** (facoltativo): pesca solo canzoni con `key === 0`, per i karaoke
  dove il video non si può trasporre. Ricordato sul telefono (`karaoke.original.v1`),
  **non** sincronizzato: dipende dal locale in cui si è, non dalla serata.

## Design
- Tema **Material** (seed `#A8EBF1`, verde acqua), giorno = schema light, notte = schema dark.
  Il mockup usava una palette indaco provvisoria: nell'app è già sostituita.
- Layout, forme (vetro, card che si trascina, pulsante Pesca grande) e testi come nel mockup.
- **Icona dell'app** ("duetto di dadi", scelta da Ester): due microfoni con la testa a dado, speculari
  e distanziati, uno verde acqua (#9DF0F8) e uno azzurro (#D7E3FF), con una nota musicale bianca in mezzo,
  su fondo #00696F. Sorgente: `design/icone/d-duetto-dadi.svg`, copiata in `public/favicon.svg`; le PNG si
  rigenerano con `npm run icons` (`pwa-assets.config.mjs`: sfondo verde acqua fino ai bordi per iPhone e
  Android maskable). In `design/icone/` ci sono anche le proposte scartate (a-microfono, b-due-voci, c-dado).
- Mobile first, target touch ≥ 44px, testi accessibili (contrasto ≥ 4.5:1).
- **Layout fisso allo schermo:** la pagina non scorre mai (`html, body { overflow: hidden }`,
  `.app` alta `100dvh`). La home deve stare sempre tutta in una schermata: le misure usano
  `clamp(min, …dvh, max)` e si stringono sugli schermi bassi (blocco "layout fisso allo schermo"
  in fondo ad `app.css`). Provata a 375×600, 375×667, 390×844. Se si aggiunge qualcosa alla home,
  riprovare a 375×600. Lista e moduli scorrono solo al loro interno.

## Da fare / decisioni aperte
- [x] Stack e prima versione della PWA.
- [x] Dati **offline** sul telefono (localStorage).
- [x] Tema Material al posto della palette provvisoria.
- [x] Canzoni importate da Notion (133).
- [x] Hosting su **Vercel** (deploy automatico da GitHub).
- [x] **Sync gratuita** tra i 2 telefoni (Vercel Blob privato + codice famiglia).
- [ ] Impostare `FAMILY_CODE` su Vercel e inserire lo stesso codice sui due telefoni.
- [x] Modificare una canzone dalla lista.
- [ ] Eliminare una canzone (con la sync serve una "lapide": segnarla come eliminata, non toglierla).
- [x] Sync verificata tra i due telefoni (2026-11-27): pallino verde.
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
- 2026-11-27 — Sync con pallino rosso sui telefoni: il codice ora viaggia nel corpo della richiesta
  (non nell'header, che rifiuta gli accenti); salvataggio di riserva se l'ETag non torna; log `[sync]`
  e dettaglio dell'errore in app. Aggiunta la modifica delle canzoni (tocco sulla canzone nella lista).
- 2026-11-27 — Anche la serata è condivisa tra i telefoni (canzoni viste, pescate, interruttore,
  "Ricomincia la serata"), salvata in `karaoke/night.json` accanto alle canzoni.
- 2026-11-27 — Filtro "Solo tonalità originale" nella pesca (sotto "Che atmosfera?").
- 2026-11-27 — Layout fisso allo schermo: la home si adatta all'altezza (dopo un "aggiorna" i
  pulsanti Lista/Aggiungi risultavano tagliati), la pagina non scorre più.
- 2026-11-27 — Nuova icona "duetto di dadi" (mix delle 3 proposte: microfono + due voci + dado),
  con la nota musicale al posto del cuore.
- 2026-11-27 — Aggiunte le canzoni di Vale (Notion, 15, cantante nuovo "Con Vale" = duetti Ester+Vale)
  e due liste vecchie di Ester (duetti con la mamma + solo sue): 180 canzoni in tutto (+47). Doppioni uniti,
  tonalità del database tenute, artisti corretti per le liste vecchie (es. Le tasche piene di sassi →
  Jovanotti, La camisa negra → Juanes, Mary → Gemelli Diversi). Esclusa "Heaven (" (riga tagliata).
  Papà: nessuna lista su Notion, non aggiunto. `SEED_VERSION` = 2.
- 2026-11-27 — "Chi canta?" diventa a persone (Ester, Mamma, Papà, Vale) con scelta multipla, al posto
  di un cerchio per ogni combinazione (proposta di Ester). Aggiunti papà (18 da solo, 2 con la mamma:
  Quella carezza della sera, Ti lascerò; 1 con Ester: La luna e la gatta — le altre in attesa di conferma),
  la lista "Mamma" e il resto dei duetti con la mamma (Renga, Negramaro…): 236 canzoni. Tonalità −3 da
  lista per Maledetta primavera, L'uomo che amava le donne, Senza pietà, Karaoke, Dance monkey; Iris +1.
  Artisti incerti: Sigarette (messo Lucio Corsi), La valigia sul letto e Domani (vuoti), Iris (messo
  Biagio Antonacci). `SEED_VERSION` = 3 (le canzoni mai toccate prendono la versione nuova).
