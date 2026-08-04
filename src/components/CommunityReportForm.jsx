import { useState } from "react";
import { submitReport, geocodeForMap } from "../api/client.js";

// Matches Faith's backend exactly: "Report types: accident, flood,
// road_closure, heavy_traffic, construction, breakdown"
const REPORT_TYPES = [
  { value: "accident", label: "Accident" },
  { value: "flood", label: "Flood" },
  { value: "road_closure", label: "Road closure" },
  { value: "heavy_traffic", label: "Heavy traffic" },
  { value: "construction", label: "Construction" },
  { value: "breakdown", label: "Breakdown" },
];

export default function CommunityReportForm({ city, onReportSubmitted }) {
  const [type, setType] = useState(REPORT_TYPES[0].value);
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!location.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      // The backend needs lat/lng, not just a place name — geocode it first.
      const point = await geocodeForMap(location.trim(), city);
      await submitReport({ city, type, location: location.trim(), lat: point.lat, lng: point.lng });
      setStatus("sent");
      setLocation("");
      onReportSubmitted?.();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <h3>Report something on your route</h3>

      <div className="field">
        <label htmlFor="report-type">Type</label>
        <select id="report-type" value={type} onChange={(e) => setType(e.target.value)}>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="report-location">Location</label>
        <input
          id="report-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Mombasa Road, near Nyayo Stadium"
          required
        />
      </div>

      <button type="submit" className="btn-secondary" disabled={status === "sending"}>
        {status === "sending" ? "Submitting…" : "Submit report"}
      </button>

      {status === "sent" && <p className="form-status success">Thanks — this helps other commuters.</p>}
      {status === "error" && <p className="form-status error">{errorMsg || "Couldn't submit that. Try again."}</p>}
    </form>
  );
}
