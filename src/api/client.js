// Talks to Faith's real FastAPI backend — no mock/local fallback. If
// VITE_API_URL isn't set, or the backend is unreachable, this throws a
// real, descriptive error rather than silently substituting fake data.

import { geocodeLocation } from "./geocode.js";

const API_URL = import.meta.env.VITE_API_URL;

function requireApiUrl() {
  if (!API_URL) {
    throw new Error(
      "VITE_API_URL isn't set — the app has no backend to call. Add it to .env.local (local dev) or your Vercel project's environment variables (deployed)."
    );
  }
}

async function handleResponse(res, action) {
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.detail ? `: ${JSON.stringify(body.detail)}` : "";
    } catch {
      /* response wasn't JSON — ignore */
    }
    throw new Error(`${action} failed (${res.status})${detail}`);
  }
  return res.json();
}

// ── FIX 1: City-enriched place names ─────────────────────────────────────────
// Nominatim geocoding on the backend needs city context to resolve ambiguous
// place names. "Kasarani" alone can match dozens of places globally.
// "Kasarani, Nairobi" resolves immediately and correctly.
// This enrichment is done here in the client so the backend stays clean.
function enrichPlace(place, city) {
  if (!place || !city) return place;
  const p = place.trim();
  const c = city.trim();
  // Don't double-add city if user already typed it
  if (p.toLowerCase().includes(c.toLowerCase())) return p;
  return `${p}, ${c}`;
}

// ── FIX 2: Use /v2/predict — includes confidence, flood risk, weather trend ──
// Single prediction for one mode — matches Faith's real /v2/predict contract.
export async function getPrediction({ origin, destination, mode, time, city }) {
  requireApiUrl();
  const res = await fetch(`${API_URL}/v2/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin:      enrichPlace(origin, city),
      destination: enrichPlace(destination, city),
      mode,
      time,
      city,
    }),
  });
  return handleResponse(res, "Prediction request");
}

// Fetches predictions for every mode supported in this city, in parallel,
// so the UI can show a Google-Maps/Uber-style side-by-side comparison.
// One failed mode doesn't sink the others.
export async function getModeComparison({ origin, destination, time, city, modes }) {
  const results = await Promise.allSettled(
    modes.map((mode) => getPrediction({ origin, destination, mode, time, city }))
  );

  return modes
    .map((mode, i) => {
      const outcome = results[i];
      return outcome.status === "fulfilled" ? { mode, ...outcome.value } : null;
    })
    .filter(Boolean);
}

// ── FIX 3: Use /v2/report — ethics check + privacy anonymization + expiry ────
export async function submitReport({ city, type, location, lat, lng }) {
  requireApiUrl();
  const res = await fetch(`${API_URL}/v2/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, type, location, lat, lng }),
  });
  return handleResponse(res, "Report submission");
}

export async function getReports(city) {
  requireApiUrl();
  const res = await fetch(`${API_URL}/reports?city=${encodeURIComponent(city)}`);
  const data = await handleResponse(res, "Fetching reports");
  return data.reports ?? [];
}

// ── FIX 4: Enrich place names in /recommend too ───────────────────────────────
export async function getRecommendation({ origin, destination, mode, city, time }) {
  requireApiUrl();
  const res = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin:      enrichPlace(origin, city),
      destination: enrichPlace(destination, city),
      mode,
      city,
      time,
    }),
  });
  return handleResponse(res, "Recommendation request");
}

export async function getModes(city) {
  requireApiUrl();
  const res = await fetch(`${API_URL}/modes?city=${encodeURIComponent(city)}`);
  return handleResponse(res, "Fetching modes");
}

// ── FIX 5: checkHealth was missing the fetch call entirely ───────────────────
export async function checkHealth() {
  requireApiUrl();
  const res = await fetch(`${API_URL}/health`);
  return handleResponse(res, "Health check");
}

// Client-side only, purely for placing pins on the map — the backend's
// /predict response doesn't include coordinates, so this is separate from
// getting the actual prediction.
export async function geocodeForMap(query, city) {
  return geocodeLocation(query, city);
}
