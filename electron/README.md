# Pitlane Desktop (Electron)

App desktop **tutto-in-uno**: client (dashboard) + server (api + realtime) nella stessa applicazione. Niente deploy su Vercel/Railway.

## Requisiti

- **Node.js** 18+
- **Rust** (per compilare `api` e `realtime`)
- **Yarn** (nella cartella `dashboard`)

## Sviluppo / prova in locale

1. **Prepara le risorse** (compila Rust e dashboard, copia tutto in `electron/resources/`):

   Dalla **root del repo** (Pitlane):

   ```bash
   node electron/build.js
   ```

   Oppure da `electron/`:

   ```bash
   node build.js
   ```

   Lo script:
   - esegue `cargo build --release -p api -p realtime`
   - esegue la build della dashboard con `NEXT_STANDALONE=1` e URL localhost
   - copia i binari in `electron/resources/bin/`
   - copia la dashboard standalone in `electron/resources/app/`

2. **Avvia l’app Electron**:

   ```bash
   cd electron
   npm install
   npm start
   ```

   Si aprirà la finestra con la dashboard; api e realtime girano in locale (porte 4001 e 4000).

## Pacchettizzare l’app (installer)

Dopo aver eseguito `node electron/build.js` dalla root:

```bash
cd electron
npm install
npm run dist
```

Gli installer saranno in `electron/dist/` (es. Windows NSIS, macOS DMG, Linux AppImage).

## Struttura

- **main.js** – processo principale Electron: avvia api, realtime e il server Next.js standalone, poi apre la finestra su `http://127.0.0.1:3000`.
- **resources/bin/** – binari `api` e `realtime` (creati da `build.js`).
- **resources/app/** – output standalone della dashboard (creato da `build.js`).

## Porte usate

| Servizio   | Porta |
|-----------|--------|
| Dashboard | 3000   |
| Realtime  | 4000   |
| API       | 4001   |

Tutto in ascolto su `127.0.0.1` (solo locale).

## Icona dell’app

L’app usa l’icona da `dashboard/public/icone/pitlane-icon.svg`. Per la finestra e l’installer puoi esportare quella SVG in:
- `electron/icon.png` (256×256, per la finestra e Linux)
- `electron/icon.ico` (Windows, opzionale)
- `electron/icon.icns` (macOS, opzionale)

Se non presenti, viene usata l’icona predefinita di Electron.
