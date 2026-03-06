# Deploy backend su Railway

La dashboard si aspetta **due backend distinti**:

| Servizio  | Endpoint principali        | Variabile dashboard      |
|-----------|----------------------------|---------------------------|
| **api**   | `/api/schedule`, `/api/schedule/next` | `API_URL`                 |
| **realtime** | `/api/realtime`, `/api/drivers`, `/api/current` | `NEXT_PUBLIC_LIVE_URL` |

Se su Railway hai un **solo** servizio, la metà delle chiamate (schedule o realtime) non troverà risposta.

---

## 1. Creare due servizi su Railway

1. **Servizio 1 – API (schedule)**  
   - Deploy dalla cartella `api/` (o da un Dockerfile che builda il crate `api`).  
   - Variabili consigliate:
     - `ORIGIN` = `https://tuo-dominio-dashboard.vercel.app` (e, se serve, `;http://localhost:3000`)
     - `PORT` è impostato da Railway, il codice lo usa in automatico.

2. **Servizio 2 – Realtime (SSE, piloti, stato)**  
   - Deploy dalla cartella `realtime/` (o da un Dockerfile che builda il crate `realtime`).  
   - Stesse variabili:
     - `ORIGIN` = come sopra  
     - `PORT` gestito da Railway.

Ottieni **due URL** (es. `pitlane-api.up.railway.app` e `pitlane-realtime.up.railway.app`).

---

## 2. Configurare la dashboard

Imposta:

- **API_URL** = URL del servizio **api** (es. `https://pitlane-api.up.railway.app`)
- **NEXT_PUBLIC_LIVE_URL** = URL del servizio **realtime** (es. `https://pitlane-realtime.up.railway.app`)

Su Vercel: **Settings → Environment Variables**. In locale: `dashboard/.env`.

---

## 3. Se vedi “Application failed to respond” o 502

- **Log su Railway**: Dashboard Railway → tuo servizio → **Deployments** → ultimo deploy → **View Logs**. Controlla che il processo parta e resti in ascolto (niente crash al bootstrap).
- **Porta**: Il codice usa la variabile **PORT** iniettata da Railway. Se non hai fatto redeploy dopo l’introduzione del supporto a `PORT`, rifai un deploy.
- **CORS**: Se le richieste partono ma il browser segnala CORS, verifica che **ORIGIN** su Railway contenga esattamente l’URL della dashboard (es. `https://pitlane-nine.vercel.app`).

---

## 4. Un solo URL (opzionale)

Se vuoi usare **un solo** dominio Railway per entrambi i backend, serve un **proxy** (o un unico servizio che espone le route di api e realtime). Non è la configurazione standard di questo repo; la via consigliata è **due servizi Railway** e due URL nelle variabili della dashboard.
