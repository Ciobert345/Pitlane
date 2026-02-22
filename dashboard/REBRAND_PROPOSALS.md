# Rebrand completato: Pitlane

Il progetto è stato rebrandizzato a **Pitlane**. Nome e logo sono stati aggiornati in:
- metadata, manifest, package.json
- Home, Footer, Sidebar, NavBar, Help
- Logo: `public/pitlane-logo.svg` (striscia pit lane + P + "itlane")

**Cartelle:** Le route dell’app usano `/dashboard/*`; la cartella `src/app/dashboard` non è stata rinominata per non rompere link e import. Se vuoi rinominare la **cartella root** del progetto (es. da `f1-dash-4.0.2` a `pitlane`), puoi farlo manualmente dal file system; i path interni non dipendono dal nome della root.

---

# Proposte rebrand – Nome e logo (archivio)

## Nomi proposti

### Opzione A – **Pitlane**
- Breve, memorabile, richiama la F1 (pit lane).
- Dominio possibile: pitlane.app, pitlane.live, getpitlane.com

### Opzione B – **Lapstream**
- Evoca “lap” (giro) e “stream” (flusso dati in tempo reale).
- Adatto a telemetria e live timing.

### Opzione C – **Grid Live**
- “Grid” = griglia di partenza; “Live” = dati in diretta.
- Chiaro e professionale.

### Opzione D – **Timing Hub**
- Descrittivo: hub per il timing F1.
- Meno “brand”, più funzionale.

### Opzione E – **Race Pulse**
- “Pulse” = battito, dati in tempo reale, sensazione di essere “in gara”.
- Tono moderno e un po’ tech.

### Opzione F – **Live Grid**
- Inversione di “Grid Live”; stesso concetto, suono leggermente diverso.

### Opzione G – **Podium**
- Richiama il podio, la F1, l’obiettivo della gara.
- Semplice e riconoscibile.

### Opzione H – **Sector**
- Un “settore” del circuito; minimal e tech.
- Può essere “Sector Live” o solo “Sector”.

---

## Concept logo

### 1. **Pitlane**
- **Icona**: striscia orizzontale stilizzata (pit lane) con una piccola “P” o un’asta che suggerisce un’auto vista dall’alto.
- **Stile**: linee pulite, angoli leggermente smussati, colore accent tipo f1-neon (rosso) su sfondo scuro.

### 2. **Lapstream**
- **Icona**: cerchio aperto (un giro) con una freccia o onda che indica flusso/dati.
- **Stile**: geometrico, minimale, possibile gradiente o tratto singolo.

### 3. **Grid Live / Live Grid**
- **Icona**: griglia 2×2 o 3×2 (come le posizioni sulla griglia) con un punto “live” (pallino rosso o glow).
- **Stile**: pixel/geometrico, molto riconoscibile anche in piccolo.

### 4. **Race Pulse**
- **Icona**: linea tipo battito cardiaco (ECG) che forma una “R” o che attraversa un cerchio (pista).
- **Stile**: dinamico, un solo tratto o pochi tratti, colore accent.

### 5. **Podium**
- **Icona**: tre gradini di podio stilizzati; la figura può essere anche molto astratta (tre barre orizzontali in altezze 1–2–3).
- **Stile**: minimal, icona che funziona bene in favicon e header.

### 6. **Sector**
- **Icona**: arco di cerchio (settore di pista) con un segmento evidenziato o un numero “1”/“S” integrato.
- **Stile**: geometrico, pulito, adatto a app/dashboard.

### 7. **Generico “live timing”**
- **Icona**: cronometro stilizzato (cerchio + lancette) con un punto “live” (rosso) o onda.
- **Stile**: universale per “timing”, adattabile a qualsiasi nome scelto.

---

## Raccomandazione rapida

- **Nome**: **Pitlane** o **Lapstream** – distintivi, brevi, facili da ricordare e da associare alla F1 e al live.
- **Logo**: partire da un’icona geometrica (griglia, settore, o “live” indicator) che funzioni in piccolo (favicon, nav) e in grande (hero home). Colore accent rosso (f1-neon) per coerenza con il resto del sito.

Dopo aver scelto nome e direzione del logo, si può:
1. Aggiornare `metadata.ts`, testi in nav/footer e ovunque compaia il nome.
2. Sostituire `public/tag-logo.svg` (e favicon) con il nuovo logo.
3. Aggiornare `REBRAND_PROPOSALS.md` con la scelta definitiva.
