# CommuteIQ — Frontend

React + Vite frontend for CommuteIQ, an AI-powered commute assistant for
African cities. Built for the Girls in STEM Global Hackathon 2026 under
[Mazal Arc](https://mazalarc.com).

**Live demo:** https://commuteiq-frontend.vercel.app

---

## What it does

CommuteIQ tells commuters not just *where* to go but *when* to leave and
*why* — across 15 transport modes in 11 African cities. The frontend
connects to a FastAPI backend that runs XGBoost travel-time prediction,
safety scoring from real crash data, live weather intelligence, flood zone
detection, and community-powered road reports.

---

## Local setup

```bash
npm install
npm run dev
```

Opens at **http://localhost:5173**.

You need a running backend for predictions to work. Set your backend URL:

```bash
cp .env.local.example .env.local
# Edit .env.local and set VITE_API_URL to your backend URL
```

| Environment | Value |
|---|---|
| Local backend | `http://localhost:8000` |
| Railway (deployed) | `https://your-app.up.railway.app` |

If `VITE_API_URL` is not set, the app throws a descriptive error — there
is no mock fallback. Run the backend locally or point to the deployed one.

---

## Project structure

```
public/                          Static assets

src/
├── api/
│   ├── client.js                All backend API calls (predict, recommend, report, modes)
│   ├── geocode.js               Nominatim geocoding — used for map pin placement only
│   └── format.js                formatDuration() helper (e.g. "1h 20min")
│
├── components/
│   ├── RouteSearchForm.jsx      Country/city selector, origin/destination, mode pills, time
│   ├── ResultsCard.jsx          Travel time, safety score, AI explanation, v2 intelligence
│   ├── SafetyScoreBadge.jsx     Circular 0-100 safety badge (Safe / Caution / High risk)
│   ├── DepartureOptions.jsx     4-window departure comparison with arrival times
│   ├── MapView.jsx              Leaflet map, route line, origin/destination pins, report pins
│   └── CommunityReportForm.jsx  Submit accident/flood/closure/traffic report
│
├── App.jsx                      Root layout, state management, search orchestration
├── main.jsx                     React entry point
└── index.css                    All styles
```

---

## API endpoints used

| Call | Endpoint | Purpose |
|---|---|---|
| `getModes(city)` | `GET /modes?city=` | Populate transport mode pills per city |
| `getPrediction(...)` | `POST /v2/predict` | Full prediction with confidence, flood risk, weather trend |
| `getModeComparison(...)` | `POST /v2/predict` × N | Parallel predictions for all modes |
| `getRecommendation(...)` | `POST /recommend` | 4 departure windows with best recommendation |
| `submitReport(...)` | `POST /v2/report` | Ethics-enforced community report with expiry |
| `getReports(city)` | `GET /reports?city=` | Active community reports for map pins |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ Yes | Full URL of the FastAPI backend, no trailing slash |

Create `.env.local` for local development:
```
VITE_API_URL=http://localhost:8000
```

For Vercel: Project Settings → Environment Variables → add `VITE_API_URL`.

---

## Deploying to Vercel

1. Push this repo to GitHub (must be on `main` branch)
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Vercel auto-detects Vite — no build config needed
4. Add environment variable: `VITE_API_URL` = your Railway backend URL
5. Deploy

Every push to `main` triggers an automatic redeploy.
Every branch/PR gets its own preview URL.

---

## Running the backend locally

```bash
git clone https://github.com/FaithOdhe-bot/CommuteIQ-backend.git
cd CommuteIQ-backend
pip install -r requirements.txt
python train_models.py                    # generates /models/*.pkl
cp .env.example .env                      # add Supabase keys
uvicorn app.main:app --reload --port 8000
```

Swagger UI available at **http://localhost:8000/docs**

---

## Transport modes supported

| Nigeria | Kenya |
|---|---|
| 🚗 Private Car | 🚗 Private Car |
| 🚌 Danfo (Yellow Bus) | 🚐 Matatu (Minibus) |
| 🚍 BRT Bus | 🚌 City Bus / KBS |
| 🛵 Okada (Motorcycle Taxi) | 🛵 Boda Boda |
| 🛺 Keke Napep (Tricycle) | 🛺 Tuk-Tuk |
| 🚖 Ride Share (Bolt/Uber) | 🚕 Taxi / Cab |
| 🚶 Walking | 🚖 Ride Share (Bolt/Uber/Little) |
| | 🚶 Walking |

---

## Cities supported

**Nigeria:** Lagos, Abuja, Kano, Ibadan, Port Harcourt, Enugu

**Kenya:** Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, and 16 more counties

---

## Tech stack

- **React 18** + **Vite 5**
- **Leaflet.js** + **react-leaflet** — interactive map
- **OpenStreetMap Nominatim** — place name geocoding for map pins
- **FastAPI backend** — all predictions, safety scoring, recommendations

---

## Team

| Name | Role |
|---|---|
| Faith Odhe |
Data cleaning| feature engineering |ML model training |safety scoring |road quality |transport modes| weather intelligence| ethical design |Devpost write-up

| Vivian Ndung'u | Full-Stack Developer — FastAPI backend architecture | React frontend |Supabase database| OSRM/Nominatim integration| Vercel deployment| map rendering

