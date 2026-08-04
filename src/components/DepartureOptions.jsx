import { formatDuration } from "../api/format.js";

export default function DepartureOptions({ recommendation }) {
  if (!recommendation) return null;

  return (
    <div className="departure-options">
      <h3>When should you leave?</h3>
      <p className="departure-headline">{recommendation.recommended_departure}</p>
      <div className="departure-windows">
        {recommendation.windows.map((w) => (
          <div key={w.label} className={`departure-window ${w.offset_min === recommendation.best_window.offset_min ? "best" : ""}`}>
            <div className="departure-window-label">{w.label}</div>
            <div className="departure-window-time">{formatDuration(w.travel_time)}</div>
            <div className="departure-window-quality">{w.emoji} {w.congestion}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
