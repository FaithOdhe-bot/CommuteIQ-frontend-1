# CommuteIQ — Frontend

React + Vite frontend for the CommuteIQ hackathon project. Works fully
on **real, free data** before your backend is ready: real geocoding, real
road-network routing, and a documented (not invented) congestion model.

## Local setup

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. With no `.env.local` file, the app geocodes
your origin/destination for real via OpenStreetMap Nominatim, gets a real
route from OSRM, and applies a mode/time-of-day multiplier calibrated
against published commute-time research (see comments in
`src/api/congestionModel.js` for exact sources). The results card flags
this clearly so no one mistakes it for a live ML prediction from your
backend.

## Data sources used

| Source | What it gives you | Free? |
|---|---|---|
| [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org) | Geocoding place names to coordinates | Yes, rate-limited |
| [OSRM public demo](http://project-osrm.org) | Real driving/walking routes and distances | Yes, for light/demo use |
| [Travel Times by Transportation Mode in Nairobi](https://zenodo.org/records/1134020) (Rising & Campbell, 2017) | Measured walking/driving/matatu travel times across Nairobi — useful for calibrating or training a real model | Yes |
| [Nairobi Matatu GTFS](https://hub.tumidata.org) (Digital Matatus) | Real matatu route/stop geometry | Yes |
| [Kenya Roads / Nigeria Roads](https://data.humdata.org) (OSM exports via HDX) | Full road network data for both countries | Yes |

Nigeria doesn't yet have an equivalent measured danfo/okada dataset — that's
a real, disclosed gap, not something papered over. The app estimates Lagos
modes using the same OSRM road data plus a multiplier calibrated against
published Lagos commute-time research, clearly labeled as estimated.

## Connecting the real backend

1. Copy `.env.local.example` to `.env.local`.
2. Set `VITE_API_URL` to your Render backend URL.
3. Restart `npm run dev`.

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: New Project → import the repo → it auto-detects Vite.
3. In Project Settings → Environment Variables, add `VITE_API_URL` with
   your Render backend URL.
4. Deploy. Every push to `main` redeploys automatically; every branch/PR
   gets its own preview URL.

## Project structure

```
src/
  api/client.js              API calls + mock fallback
  components/
    RouteSearchForm.jsx      Origin, destination, mode, time
    ResultsCard.jsx          ETA, safety score, AI explanation, advice
    SafetyScoreBadge.jsx     Small circular 0-100 score badge
    MapView.jsx              Leaflet map + community report pins
    CommunityReportForm.jsx  Submit an accident/flood/traffic/closure report
  App.jsx                    Layout + state
  index.css                  All styling
```
