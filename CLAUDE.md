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
| Tema colori Material (export Material Theme Builder, seed `#A8EBF1`) | `karaoke_app.json` |
| Token colore per Penpot (palette tonali + schemi) | `karaoke_app_penpot_tokens.json` |

Il mockup è la fonte di verità per schermate e comportamento finché non esiste il codice.

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
{ id, title, artist,
  key,      // tonalità: intero rispetto all'originale (0 = Originale, −2, +1…)
  singers,  // ['ester' | 'mamma' | 'insieme']
  moods,    // ['allegra' | 'ballare' | 'gruppo']
  last,     // giorni dall'ultima volta cantata, null = mai cantata
  score }   // gradimento: +1 quando si canta, −1 quando si scarta
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
- Palette indaco / carta da zucchero, tema **giorno** e **notte**.
- I colori nel mockup sono variabili CSS (`--primary`, `--on-primary`, `--ink`, `--bg`,
  `--glass-*`…): vanno mappati sul tema Material di `karaoke_app.json`.
- Mobile first, target touch ≥ 44px, testi accessibili (contrasto ≥ 4.5:1).

## Da fare / decisioni aperte
- [ ] Scegliere lo stack e scrivere il codice della PWA.
- [ ] Dati **offline** sul telefono.
- [ ] **Sync gratuita** tra i 2 telefoni (Ester e mamma).
- [ ] Hosting su **Vercel**.
- [ ] Applicare il tema Material al posto della palette provvisoria del mockup.

## Registro decisioni
- 2026-11-23 — Creato il tema Material (seed `#A8EBF1`) e i token Penpot.
- 2026-11-26 — Mockup interattivo con tema giorno/notte e regole di pesca sopra.
- 2026-11-26 — Collegata la cartella locale al repository GitHub; creata questa memoria.
- 2026-11-26 — Regola di sync: `git pull` a inizio sessione, commit + push dopo ogni modifica (accesso anche da telefono a computer spento).
