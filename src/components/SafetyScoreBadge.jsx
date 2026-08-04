export default function SafetyScoreBadge({ score }) {
  const tier = score >= 75 ? "high" : score >= 50 ? "mid" : "low";
  const label = tier === "high" ? "Safe" : tier === "mid" ? "Caution" : "High risk";

  return (
    <div className={`safety-badge safety-${tier}`}>
      <span className="safety-score">{score}</span>
      <span className="safety-label">{label}</span>
    </div>
  );
}
