import { formatDuration } from "../api/format.js";
import SafetyScoreBadge from "./SafetyScoreBadge.jsx";

// ── Arrival time helper ───────────────────────────────────────────────────────
// Calculates "Depart 07:30 → Arrive 08:14" from departure time + travel mins.
// If no departure time was entered, uses current time so the display is always
// meaningful rather than blank.
function calcArrival(departureTime, travelMins) {
  if (!travelMins || travelMins === 0) return null;
  try {
    let hour, minute;
    if (departureTime) {
      [hour, minute] = departureTime.split(":").map(Number);
    } else {
      const now = new Date();
      hour   = now.getHours();
      minute = now.getMinutes();
    }
    const total    = hour * 60 + minute + Math.round(travelMins);
    const arrHour  = Math.floor(total / 60) % 24;
    const arrMin   = total % 60;
    return `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

export default function ResultsCard({ result, departureTime }) {
  if (!result) return null;

  // ── Guard: 0 km means geocoding failed ─────────────────────────────────────
  // When the backend can't resolve origin/destination it returns distance 0.
  // Show a helpful prompt instead of a broken "0 min / 0 km" card.
  if (!result.distance_km || result.distance_km === 0) {
    return (
      <div className="results-card results-card--error">
        <p className="results-error-title">⚠️ Could not calculate route</p>
        <p className="results-error-body">
          Try being more specific — e.g.{" "}
          <strong>"Kasarani Estate"</strong> instead of <strong>"Kasarani"</strong>,
          or <strong>"Victoria Island, Lagos"</strong> instead of{" "}
          <strong>"Victoria Island"</strong>.
        </p>
      </div>
    );
  }

  const arrivalTime = calcArrival(departureTime, result.travel_time_min);

  return (
    <div className="results-card">

      {/* ── Top row: mode, ETA, distance, safety badge ── */}
      <div className="results-top">
        <div>
          <div className="results-mode">
            {result.mode_emoji && <span>{result.mode_emoji} </span>}
            {result.mode_label ?? result.mode}
          </div>
          <div className="results-eta">{formatDuration(result.travel_time_min)}</div>
          <div className="results-distance">{result.distance_km} km</div>

          {/* Arrival time — depart now/at X → arrive Y */}
          {arrivalTime && (
            <div className="results-arrival">
              🕐 {departureTime ? `Depart ${departureTime}` : "Leave now"}{" "}
              → Arrive <strong>{arrivalTime}</strong>
            </div>
          )}
        </div>
        <SafetyScoreBadge score={result.safety_score} />
      </div>

      {/* ── Route confidence stars (v2) ── */}
      {result.route_confidence && (
        <div className="results-route-confidence">
          <span className="stars">{result.route_confidence.display}</span>
          <span className="confidence-label">
            {result.route_confidence.label} route confidence
          </span>
        </div>
      )}

      {/* ── Commute quality ── */}
      <div className="results-quality">
        <span>{result.quality_emoji}</span> Commute quality:{" "}
        <strong>{result.commute_quality}</strong>
      </div>

      {/* ── Live conditions pills ── */}
      <div className="results-conditions">
        <span className="condition-pill">🌦 {result.weather}</span>
        <span className="condition-pill">🚦 {result.congestion} congestion</span>
        {typeof result.community_reports === "number" && (
          <span className="condition-pill">
            📍 {result.community_reports} recent report{result.community_reports !== 1 ? "s" : ""}
          </span>
        )}
        {result.road_quality_score != null && (
          <span className="condition-pill">
            🛣️ Road quality {result.road_quality_score}/100
          </span>
        )}
      </div>

      {/* ── AI explanation ── */}
      <p className="results-explanation">{result.ai_explanation}</p>

      {/* ── Flood risk warning (v2) — only shown when risk is Medium or High ── */}
      {result.flood_risk?.warning && (
        <div className="results-flood-warning">
          {result.flood_risk.warning}
        </div>
      )}

      {/* ── Weather trend (v2) — only shown when something meaningful is coming ── */}
      {result.weather_trend?.trend_type !== "stable" &&
        result.weather_trend?.trend_message && (
          <div className="results-weather-trend">
            {result.weather_trend.trend_message}
          </div>
        )}

      {/* ── Day pattern (v2) — only shown on notably busy or quiet days ── */}
      {result.day_pattern?.severity &&
        ["High", "Low"].includes(result.day_pattern.severity) && (
          <div className="results-day-pattern">
            {result.day_pattern.pattern_message}
          </div>
        )}

      {/* ── Confidence score (v2) ── */}
      {result.confidence && (
        <div className="results-confidence">
          <span className="confidence-emoji">{result.confidence.emoji}</span>
          <span className="confidence-summary">{result.confidence.summary}</span>
        </div>
      )}

      {/* ── Alternative mode suggestion ── */}
      {result.alt_suggestion && (
        <p className="results-alt-suggestion">{result.alt_suggestion}</p>
      )}

      {/* ── Demand balancer — staggered departure (v2) ── */}
      {result.staggered_departure && (
        <div className="results-staggered">
          {result.staggered_departure.display}
        </div>
      )}

      {/* ── Departure advice ── */}
      <div className="results-advice">
        <span className="advice-label">Recommendation</span>
        <span className="advice-value">{result.departure_advice}</span>
      </div>

    </div>
  );
}
