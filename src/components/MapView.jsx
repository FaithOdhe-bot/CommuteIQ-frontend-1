import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Vite bundles assets differently from Webpack — Leaflet's default icon
// loader breaks because it uses __webpack_public_path__ internally.
// Deleting _getIconUrl and merging the imported paths fixes all three
// 404s (marker-icon.png, marker-icon-2x.png, marker-shadow.png).
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

const CITY_CENTERS = {
  // Nigeria
  lagos: [6.5244, 3.3792], abuja: [9.0765, 7.3986], kano: [12.0022, 8.5920],
  ibadan: [7.3775, 3.9470], "port harcourt": [4.8156, 7.0498], enugu: [6.4584, 7.5464],
  // Kenya — all counties, not just the original 5
  nairobi: [-1.2921, 36.8219], mombasa: [-4.0435, 39.6682], kisumu: [-0.0917, 34.7680],
  nakuru: [-0.3031, 36.0800], eldoret: [0.5143, 35.2698], kiambu: [-1.1714, 36.8356],
  machakos: [-1.5177, 37.2634], "murang'a": [-0.7839, 37.1502], kilifi: [-3.6305, 39.8499],
  meru: [0.0470, 37.6559], nyeri: [-0.4201, 36.9476], kajiado: [-1.8524, 36.7820],
  kirinyaga: [-0.6591, 37.3826], narok: [-1.0833, 35.8711], embu: [-0.5310, 37.4500],
  kisii: [-0.6698, 34.7658], "homa bay": [-0.5273, 34.4571], kericho: [-0.3689, 35.2861],
  nyandarua: [-0.2716, 36.3789], kakamega: [0.2827, 34.7519], makueni: [-1.7833, 37.6333],
};
const DEFAULT_CENTER = [0.0236, 37.9062]; // Kenya/Nigeria region midpoint fallback

const REPORT_ICONS = {
  accident: "🚗", flood: "🌊", road_closure: "🚧",
  heavy_traffic: "🚦", construction: "🏗", breakdown: "🔧",
};

// Auto-fits the view to show both origin and destination, the way Google
// Maps/Uber snap to your route instead of leaving you to pan and zoom
// yourself.
function FitToPoints({ origin, destination }) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      map.fitBounds(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { padding: [40, 40] }
      );
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 13);
    }
  }, [origin, destination, map]);
  return null;
}

export default function MapView({ city = "nairobi", origin, destination, routeGeometry, reports = [] }) {
  const center = origin ? [origin.lat, origin.lng] : (CITY_CENTERS[city] ?? DEFAULT_CENTER);

  // routeGeometry (once the backend provides it — see chat) is real road
  // geometry. Until then, fall back to a straight dashed line so the map
  // still shows something meaningful.
  const line =
    routeGeometry && routeGeometry.length > 0
      ? routeGeometry
      : origin && destination
      ? [[origin.lat, origin.lng], [destination.lat, destination.lng]]
      : null;

  return (
    <div className="map-wrap">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "320px", width: "100%", borderRadius: "12px" }}
        scrollWheelZoom={true}
        key={city} // force remount when switching cities so the view resets
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToPoints origin={origin} destination={destination} />

        {line && (
          <Polyline
            positions={line}
            pathOptions={
              routeGeometry
                ? { color: "#0f6e56", weight: 5 }
                : { color: "#0f6e56", weight: 4, dashArray: "6 6" }
            }
          />
        )}

        {origin && (
          <Marker position={[origin.lat, origin.lng]}>
            <Popup>Origin: {origin.label}</Popup>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.lat, destination.lng]}>
            <Popup>Destination: {destination.label}</Popup>
          </Marker>
        )}

        {reports.map((report, i) => (
          <Marker key={i} position={[report.lat, report.lng]}>
            <Popup>
              {REPORT_ICONS[report.type] ?? "📍"} {report.type.replace("_", " ")} — {report.location}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
