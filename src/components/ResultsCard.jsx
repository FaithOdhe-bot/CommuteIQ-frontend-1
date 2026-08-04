import { formatDuration } from "../api/format.js";
import SafetyScoreBadge from "./SafetyScoreBadge.jsx";

export default function ResultsCard({ result }) {
  if (!result) return null;

  return (
    <div className="results-card">
      <div className="results-top">
        <div>
          <div className="results-mode">{result.mode_label ?? result.mode}</div>
          <div className="results-eta">{formatDuration(result.travel_time_min)}</div>
          <div className="results-distance">{result.distance_km} km</div>
        </div>
        <SafetyScoreBadge score={result.safety_score} />
      </div>

      <div className="results-quality">
        <span>{result.quality_emoji}</span> Commute quality: {result.commute_quality}
      </div>

      <div className="results-conditions">
        <span className="condition-pill">🌦 {result.weather}</span>
        <span className="condition-pill">🚦 {result.congestion} congestion</span>
        {typeof result.community_reports === "number" && (
          <span className="condition-pill">📍 {result.community_reports} recent reports</span>
        )}
      </div>

      <p className="results-explanation">{result.ai_explanation}</p>

      {result.alt_suggestion && (
        <p className="results-alt-suggestion">{result.alt_suggestion}</p>
      )}

      <div className="results-advice">
        <span className="advice-label">Recommendation</span>
        <span className="advice-value">{result.departure_advice}</span>
      </div>
    </div>
  );
}
