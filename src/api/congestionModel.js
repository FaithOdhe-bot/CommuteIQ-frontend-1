// Turns OSRM's free-flow driving time into a realistic, mode-adjusted
// estimate. These multipliers are NOT measured per-route — they're
// calibrated against published city-level commute research, and that's
// disclosed to the user in the UI (see ResultsCard's `isEstimated` flag).
// Swap these for real per-route figures as your community reports and
// the Nairobi travel-time dataset (Rising & Campbell, Zenodo, 2017) give
// you enough data to calibrate against.
//
// Sources used to calibrate:
// - Nairobi avg one-way commute: ~53.7 min (Numbeo Traffic Index, 2026)
// - Lagos avg one-way commute: ~68.3 min (Numbeo Traffic Index, 2026)
// - Nairobi matatu/walking/driving travel times: Rising & Campbell,
//   "Travel Times by Transportation Mode in Nairobi, Kenya," Zenodo, 2017

const MODE_MULTIPLIERS = {
  driving: 1.0,
  matatu: 1.35, // matatus stop frequently and follow indirect routes
  danfo: 1.35, // same structural pattern as matatus, Lagos context
  boda: 0.75, // boda-bodas can filter through stopped traffic
  walking: null, // OSRM's own walking profile is used directly, no multiplier
};

// Peak-hour bump, applied on top of the mode multiplier. Recalibrated
// against real commuter-reported peak times (e.g. ~45-75 min for an
// ~11km Nairobi peak-hour trip) rather than free-flow OSRM time alone —
// the previous 1.4x was still much closer to free-flow than to what
// gridlock actually does to a route at 7-9am/5-7pm.
function peakMultiplier(departureTime) {
  if (!departureTime) return 1.3; // assume moderate congestion if unspecified
  const hour = parseInt(departureTime.split(":")[0], 10);
  const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  return isPeak ? 2.0 : 1.2;
}

export function estimateCommute({ baseDurationMinutes, mode, departureTime }) {
  const modeMultiplier = MODE_MULTIPLIERS[mode] ?? 1.0;
  const peak = peakMultiplier(departureTime);
  const etaMinutes = Math.round(baseDurationMinutes * modeMultiplier * peak);

  const quality = etaMinutes < baseDurationMinutes * 1.2
    ? "good"
    : etaMinutes < baseDurationMinutes * 1.8
    ? "moderate"
    : "poor";

  return { etaMinutes, quality, isEstimated: true };
}
