// Free geocoding via OpenStreetMap's Nominatim service — no API key needed.
// Usage policy: max ~1 request/sec, and a descriptive User-Agent is required.
// Fine for a hackathon demo; for anything beyond that, self-host Nominatim
// or switch to a paid geocoder with higher limits.
//
// IMPORTANT: this is biased by COUNTRY (via Nominatim's countrycodes param),
// not by a specific city. "Nairobi"/"Lagos" in the dropdown just select
// Kenya vs Nigeria for transport-mode terminology — Nominatim itself already
// covers every county/state in both countries, so typing "Kisumu" or
// "Kano" resolves correctly without any extra data on our end.

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const COUNTRY_CODE = {
  nairobi: "ke", // Kenya
  lagos: "ng",   // Nigeria
  abuja: "ng",
  kano: "ng",
};

export async function geocodeLocation(query, city) {
  const countrycodes = COUNTRY_CODE[city] ?? "";
  const params = new URLSearchParams({ format: "json", limit: "1", q: query });
  if (countrycodes) params.set("countrycodes", countrycodes);

  const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { "Accept-Language": "en" },
  });

  if (!res.ok) throw new Error("Geocoding request failed");

  const results = await res.json();
  if (!results.length) {
    throw new Error(`Couldn't find a location for "${query}"`);
  }

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
    label: results[0].display_name,
  };
}
