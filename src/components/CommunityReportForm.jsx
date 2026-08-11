import { useState, useEffect, useRef } from "react";
import { submitReport, geocodeForMap } from "../api/client.js";

const REPORT_TYPES = [
  { value: "accident",      label: "🚗 Accident",     emoji: "🚗" },
  { value: "flood",         label: "🌊 Flood",         emoji: "🌊" },
  { value: "road_closure",  label: "🚧 Road closed",   emoji: "🚧" },
  { value: "heavy_traffic", label: "🚦 Heavy traffic", emoji: "🚦" },
  { value: "construction",  label: "🏗 Works",         emoji: "🏗" },
  { value: "breakdown",     label: "🔧 Breakdown",     emoji: "🔧" },
];

export default function CommunityReportForm({ city, onReportSubmitted }) {
  const [type, setType]         = useState(REPORT_TYPES[0].value);
  const [location, setLocation] = useState("");
  const [status, setStatus]     = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [expiresIn, setExpiresIn] = useState(null);
  const resetTimer = useRef(null);

  useEffect(() => {
    return () => { if (resetTimer.current) clearTimeout(resetTimer.current); };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!location.trim()) return;
    setStatus("sending"); setErrorMsg(""); setExpiresIn(null);

    try {
      const point  = await geocodeForMap(location.trim(), city);
      const result = await submitReport({ city, type, location: location.trim(), lat: point.lat, lng: point.lng });
      setExpiresIn(result.expires_in ?? null);
      setStatus("sent");
      setLocation("");
      onReportSubmitted?.();
      resetTimer.current = setTimeout(() => { setStatus("idle"); setExpiresIn(null); }, 6000);
    } catch (err) {
      if (err.message.includes("403")) {
        setErrorMsg("That report type isn't allowed — CommuteIQ doesn't permit police checkpoint reporting.");
      } else {
        setErrorMsg(err.message || "Couldn't submit. Try again.");
      }
      setStatus("error");
      resetTimer.current = setTimeout(() => { setStatus("idle"); setErrorMsg(""); }, 8000);
    }
  }

  return (
    <div className="report-section">
      <div className="report-title">📍 Report something on your route</div>

      {/* Report type grid — tap instead of dropdown */}
      <div className="report-type-grid">
        {REPORT_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            className={`report-type-btn ${type === t.value ? "selected" : ""}`}
            onClick={() => setType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        className="report-location-input"
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder={`Where? e.g. ${city === "nairobi" ? "Mombasa Road near Nyayo" : "Nnebisi Road Asaba"}`}
      />

      <button
        type="button"
        className="report-submit-btn"
        disabled={status === "sending" || !location.trim()}
        onClick={handleSubmit}
      >
        {status === "sending" ? "Submitting…" : "Submit report"}
      </button>

      {status === "sent" && (
        <div className="status-msg success">
          ✅ Thanks — this helps other commuters.
          {expiresIn && <span style={{opacity:.7}}> Expires in {expiresIn}.</span>}
        </div>
      )}
      {status === "error" && (
        <div className="status-msg error">⚠️ {errorMsg}</div>
      )}
    </div>
  );
}
