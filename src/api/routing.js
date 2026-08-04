// Real routing on actual OpenStreetMap road data, via the free public OSRM
// demo server. It returns genuine driving/walking distance and duration —
// no invented numbers. Note: the public demo server is rate-limited and
// meant for light/prototype use, not production traffic — fine for a
// hackathon demo. For the real launch, self-host OSRM or use a paid router.

const OSRM_URL = "https://router.project-osrm.org/route/v1";

// OSRM only has routing profiles for driving, walking, and cycling —
// there's no "matatu" or "danfo" profile because informal transit isn't
// mapped as a routable network anywhere. We use the driving profile as the
// physical-road baseline, then apply a documented multiplier (see
// congestionModel.js) to approximate those modes.
const OSRM_PROFILE = { driving: "driving", walking: "foot", boda: "driving", matatu: "driving", danfo: "driving" };

export async function getRoute(origin, destination, mode) {
  const profile = OSRM_PROFILE[mode] ?? "driving";
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_URL}/${profile}/${coords}?overview=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing request failed");

  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No route found between those points");
  }

  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    baseDurationMinutes: route.duration / 60, // free-flow time, no congestion applied yet
  };
}
