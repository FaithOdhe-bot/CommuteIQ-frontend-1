import { useState, useEffect, useCallback } from "react";
import MapView from "./components/MapView.jsx";
import CommunityReportForm from "./components/CommunityReportForm.jsx";
import { getModeComparison, getRecommendation, geocodeForMap, getReports, checkHealth } from "./api/client.js";
import { formatDuration } from "./api/format.js";

// Plain-language rewriter — converts backend text to human speech
function plainify(text) {
  if (!text) return "";
  return text
    .replace(/commute quality:/gi, "")
    .replace(/route confidence:/gi, "")
    .replace(/safety score \d+\/100/gi, "")
    .replace(/\. \./g, ".")
    .trim();
}

function safetyCopy(score) {
  if (!score) return { label: "Check conditions", cls: "caution" };
  if (score >= 75) return { label: "This route is generally safe", cls: "safe" };
  if (score >= 50) return { label: "Take normal precautions", cls: "caution" };
  return { label: "Be extra careful on this route", cls: "risk" };
}

export default function App() {
  const [country, setCountry]   = useState("kenya");
  const [city, setCity]         = useState("nairobi");
  const [origin, setOrigin]     = useState("");
  const [dest, setDest]         = useState("");
  const [time, setTime]         = useState("");
  const [results, setResults]   = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [recommend, setRecommend] = useState(null);
  const [originPt, setOriginPt] = useState(null);
  const [destPt, setDestPt]     = useState(null);
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  // Wake backend silently
  useEffect(() => { checkHealth().catch(() => {}); }, []);

  // City pills per country
  const CITIES = {
    kenya:   [
      { value: "nairobi",   label: "Nairobi" },
      { value: "mombasa",   label: "Mombasa" },
      { value: "kisumu",    label: "Kisumu" },
      { value: "nakuru",    label: "Nakuru" },
      { value: "eldoret",   label: "Eldoret" },
    ],
    nigeria: [
      { value: "lagos",         label: "Lagos" },
      { value: "abuja",         label: "Abuja" },
      { value: "kano",          label: "Kano" },
      { value: "ibadan",        label: "Ibadan" },
      { value: "port harcourt", label: "P/Harcourt" },
      { value: "enugu",         label: "Enugu" },
      { value: "asaba",         label: "Asaba" },
      { value: "benin city",    label: "Benin City" },
    ],
  };

  // Load reports
  const loadReports = useCallback(async () => {
    try { setReports(await getReports(city)); } catch {}
  }, [city]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Apply country theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-country", country);
  }, [country]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!origin.trim() || !dest.trim()) return;
    setLoading(true); setError(null); setResults([]); setRecommend(null);

    try {
      // city is already in state
      const modes = country === "kenya"
        ? ["driving","matatu","bus","boda_boda","tuk_tuk","taxi","rideshare","walking"]
        : ["driving","danfo","brt","okada","keke","rideshare","walking"];

      const [comparison, og, dg] = await Promise.all([
        getModeComparison({ origin: origin.trim(), destination: dest.trim(), time, city, modes }),
        geocodeForMap(origin.trim(), city),
        geocodeForMap(dest.trim(), city),
      ]);

      if (!comparison.length) throw new Error("Couldn't find a route. Try being more specific.");

      setResults(comparison);
      setExpanded(comparison[0].mode);
      setOriginPt(og); setDestPt(dg);

      getRecommendation({ origin: origin.trim(), destination: dest.trim(),
        mode: comparison[0].mode, city, time })
        .then(setRecommend).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const best = results.length
    ? results.reduce((a, b) => (a.travel_time_min < b.travel_time_min ? a : b))
    : null;

  return (
    <div className="app">
      {/* ── Header with country theme ── */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">IQ</div>
          <div className="brand-text">
            <h1>CommuteIQ</h1>
            <p>Your commute, simplified</p>
          </div>
        </div>
        <div className="country-picker">
          {[
            { key: "kenya",   flag: "🇰🇪", label: "Kenya" },
            { key: "nigeria", flag: "🇳🇬", label: "Nigeria" },
          ].map(c => (
            <button
              key={c.key}
              className={`country-btn ${country === c.key ? "active" : ""}`}
              onClick={() => {
                setCountry(c.key);
                setCity(c.key === "kenya" ? "nairobi" : "lagos");
                setResults([]); setRecommend(null);
                setOrigin(""); setDest("");
              }}
            >
              <span className="country-flag">{c.flag}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* City pills */}
        <div className="city-pills">
          {CITIES[country].map(c => (
            <button
              key={c.value}
              className={`city-pill ${city === c.value ? "active" : ""}`}
              onClick={() => { setCity(c.value); setResults([]); setRecommend(null); setOrigin(""); setDest(""); }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Search card ── */}
      <div className="search-card">
        <form onSubmit={handleSearch}>
          <div className="search-field">
            <span className="search-icon">📍</span>
            <div style={{ flex: 1 }}>
              <span className="search-label">From</span>
              <input
                className="search-input"
                placeholder={country === "kenya" ? "e.g. Kasarani" : "e.g. Ikeja"}
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="search-divider">
            <span className="divider-dot">|</span>
            <div className="divider-line" />
          </div>

          <div className="search-field">
            <span className="search-icon">🏁</span>
            <div style={{ flex: 1 }}>
              <span className="search-label">To</span>
              <input
                className="search-input"
                placeholder={country === "kenya" ? "e.g. CBD" : "e.g. Victoria Island"}
                value={dest}
                onChange={e => setDest(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="time-row">
            <span className="time-label">🕐 Leaving at</span>
            <input
              type="time"
              className="time-input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>

          <button type="submit" className="go-btn" disabled={loading}>
            {loading ? "Finding your route…" : "Get my route →"}
          </button>
        </form>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {/* ── Results ── */}
      {results.length > 0 && (
        <div className="results-section">
          <div className="results-header">Your options</div>
          <div className="mode-cards">
            {results
              .filter(r => r.distance_km > 0)
              .sort((a, b) => a.travel_time_min - b.travel_time_min)
              .map(r => {
                const isRestricted = r.alt_suggestion &&
                  (r.alt_suggestion.includes("⚠️") || r.alt_suggestion.includes("banned"));
                const isBest    = best && r.mode === best.mode && !isRestricted;
                const isExpanded= expanded === r.mode;
                const safety    = safetyCopy(r.safety_score);
                const mins      = Math.round(r.travel_time_min);
                const h         = Math.floor(mins / 60);
                const m         = mins % 60;
                const timeStr   = h > 0 ? `${h}h ${m}min` : `${mins} min`;

                return (
                  <div
                    key={r.mode}
                    className={`mode-card ${isBest ? "best" : ""} ${isExpanded ? "expanded" : ""}`}
                    onClick={() => setExpanded(isExpanded ? null : r.mode)}
                  >
                    <div className="mode-card-top">
                      <div className="mode-card-left">
                        <div className="mode-emoji-wrap">{r.mode_emoji || "🚗"}</div>
                        <div>
                          <div className="mode-name">
                            {r.mode_label || r.mode}
                            {isBest && <span className="best-badge">Best</span>}
                          </div>
                          <div className="mode-subtext">{r.distance_km?.toFixed(1)} km</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="mode-time">
                          {h > 0 ? h : mins}
                          <span className="mode-time-unit">{h > 0 ? "h" : " min"}</span>
                          {h > 0 && <><span style={{fontSize:16}}> {m}</span><span className="mode-time-unit">m</span></>}
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <div className="mode-detail">
                      {r.arrival_time && (
                        <div className="arrive-row">
                          Leave now → arrive <span className="arrive-time">{r.arrival_time}</span>
                        </div>
                      )}

                      <div className="safety-row">
                        <div className={`safety-dot ${safety.cls}`} />
                        <span className="safety-text">{safety.label}</span>
                      </div>

                      {r.ai_explanation && (
                        <p className="plain-explanation">
                          {plainify(r.ai_explanation)}
                        </p>
                      )}

                      {r.alt_suggestion && (
                        <div className={`alert-box ${
                          r.alt_suggestion.includes("banned") || r.alt_suggestion.includes("⚠️")
                            ? "danger" : ""
                        }`}>
                          {r.alt_suggestion}
                        </div>
                      )}

                      {r.flood_risk?.warning && (
                        <div className="alert-box flood">{r.flood_risk.warning}</div>
                      )}

                      <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                        {r.departure_advice}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── When to leave ── */}
      {recommend?.windows?.some(w => w.travel_time > 0) && (
        <div className="leave-section">
          <div className="leave-title">⏰ When should you leave?</div>
          <div className="leave-windows">
            {recommend.windows.map(w => {
              const isBestW = w.offset_min === recommend.best_window?.offset_min;
              const arr = (() => {
                if (!w.travel_time) return null;
                const now = new Date();
                const tot = now.getHours()*60 + now.getMinutes() + w.offset_min + Math.round(w.travel_time);
                return `${String(Math.floor(tot/60)%24).padStart(2,"0")}:${String(tot%60).padStart(2,"0")}`;
              })();
              return (
                <div key={w.label} className={`leave-window ${isBestW ? "best" : ""}`}>
                  <div className="leave-window-label">{w.label}</div>
                  <div className="leave-window-time">
                    {Math.round(w.travel_time)} <span style={{fontSize:10}}>min</span>
                  </div>
                  {arr && <div className="leave-window-arrive">→ {arr}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Map ── */}
      {(originPt || results.length > 0) && (
        <MapView
          city={city}
          origin={originPt}
          destination={destPt}
          routeGeometry={results.find(r => r.mode === expanded)?.route_geometry}
          reports={reports}
        />
      )}

      {/* ── Report ── */}
      <CommunityReportForm
        city={city}
        onReportSubmitted={loadReports}
      />

      <footer className="app-footer">
        Built for the Africa Community 💙
      </footer>
    </div>
  );
}
