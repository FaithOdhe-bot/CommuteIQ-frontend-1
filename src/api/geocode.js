// Free geocoding via OpenStreetMap's Nominatim service — no API key needed.
// Usage policy: max ~1 request/sec, and a descriptive User-Agent is required.
// Fine for a hackathon demo; for anything beyond that, self-host Nominatim
// or switch to a paid geocoder with higher limits.
//
// This file is used ONLY for placing map pins (origin/destination markers).
// The backend does its own geocoding for ML predictions — these two are
// intentionally separate so a map-pin failure doesn't block a prediction.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// FIX: Added all supported cities for both countries.
// Previously only nairobi, lagos, abuja, kano were mapped — all other cities
// returned empty countrycodes, meaning Nominatim searched globally and could
// resolve "Westlands" to a place in Germany instead of Nairobi.
const COUNTRY_CODE = {
  // Kenya — all supported cities/counties
  nairobi:    "ke",
  mombasa:    "ke",
  kisumu:     "ke",
  nakuru:     "ke",
  eldoret:    "ke",
  kiambu:     "ke",
  machakos:   "ke",
  "murang'a": "ke",
  muranga:    "ke",
  kilifi:     "ke",
  meru:       "ke",
  nyeri:      "ke",
  kajiado:    "ke",
  kirinyaga:  "ke",
  narok:      "ke",
  embu:       "ke",
  kisii:      "ke",
  "homa bay": "ke",
  homabay:    "ke",
  kericho:    "ke",
  nyandarua:  "ke",
  kakamega:   "ke",
  makueni:    "ke",
  // Nigeria — all supported cities
  lagos:         "ng",
  abuja:         "ng",
  kano:          "ng",
  ibadan:        "ng",
  "port harcourt": "ng",
  portharcourt:  "ng",
  enugu:         "ng",
};

// FIX: Enrich query with city name before geocoding so "Westlands" becomes
// "Westlands, Nairobi" — same enrichment the backend does for predictions.
// Prevents resolving ambiguous neighbourhood names to the wrong country.
function enrichQuery(query, city) {
  const q = query.trim();
  const c = city.trim();
  if (q.toLowerCase().includes(c.toLowerCase())) return q;
  return `${q}, ${c}`;
}

export async function geocodeLocation(query, city) {
  const countrycodes = COUNTRY_CODE[city?.toLowerCase()] ?? "";
  const enriched     = enrichQuery(query, city ?? "");

  const params = new URLSearchParams({
    format: "json",
    limit:  "1",
    q:      enriched,
  });
  if (countrycodes) params.set("countrycodes", countrycodes);

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      "Accept-Language": "en",
      "User-Agent":      "CommuteIQ/1.0 (hackathon project)",
    },
  });

  if (!res.ok) throw new Error("Geocoding request failed");

  const results = await res.json();

  // FIX: Return city centre as fallback instead of throwing, so map pins
  // always show something even when a neighbourhood name isn't in Nominatim.
  if (!results.length) {
    console.warn(`Geocoding found nothing for "${enriched}" — using city centre fallback`);
    return getCityCentre(city);
  }

  return {
    lat:   parseFloat(results[0].lat),
    lng:   parseFloat(results[0].lon),
    label: results[0].display_name,
  };
}

// City centre fallback coordinates — used when Nominatim returns no results.
// These place the map pin at the city centre rather than throwing an error.
const CITY_CENTRES = {
  nairobi:         { lat: -1.2921,  lng: 36.8219,  label: "Nairobi, Kenya" },
  mombasa:         { lat: -4.0435,  lng: 39.6682,  label: "Mombasa, Kenya" },
  kisumu:          { lat: -0.0917,  lng: 34.7680,  label: "Kisumu, Kenya" },
  nakuru:          { lat: -0.3031,  lng: 36.0800,  label: "Nakuru, Kenya" },
  eldoret:         { lat:  0.5143,  lng: 35.2698,  label: "Eldoret, Kenya" },
  kiambu:          { lat: -1.1714,  lng: 36.8356,  label: "Kiambu, Kenya" },
  lagos:           { lat:  6.5244,  lng:  3.3792,  label: "Lagos, Nigeria" },
  abuja:           { lat:  9.0765,  lng:  7.3986,  label: "Abuja, Nigeria" },
  kano:            { lat: 12.0022,  lng:  8.5920,  label: "Kano, Nigeria" },
  ibadan:          { lat:  7.3775,  lng:  3.9470,  label: "Ibadan, Nigeria" },
  "port harcourt": { lat:  4.8156,  lng:  7.0498,  label: "Port Harcourt, Nigeria" },
  enugu:           { lat:  6.4584,  lng:  7.5464,  label: "Enugu, Nigeria" },
};

function getCityCentre(city) {
  const key = city?.toLowerCase() ?? "";
  return CITY_CENTRES[key] ?? { lat: -1.2921, lng: 36.8219, label: city ?? "Unknown" };
}
