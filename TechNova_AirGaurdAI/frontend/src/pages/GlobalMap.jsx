import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { FiSearch, FiRefreshCw, FiInfo } from "react-icons/fi";
import { getCityAQI, getAQIByCoords, getAQIColor, getAQILabel } from "../utils/api";

// Fix Leaflet broken marker icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
});

// Fly to a city on map
function FlyToCity({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 10, { animate: true, duration: 1.5 });
  }, [coords, map]);
  return null;
}

// City list — AQI starts as null and gets filled from WAQI API live
const CITY_LIST = [
  { name: "Delhi",       query: "delhi",       lat: 28.65,  lng: 77.22  },
  { name: "Mumbai",      query: "mumbai",      lat: 19.07,  lng: 72.87  },
  { name: "Ahmedabad",   query: "ahmedabad",   lat: 23.03,  lng: 72.58  },
  { name: "Kolkata",     query: "kolkata",     lat: 22.57,  lng: 88.36  },
  { name: "Chennai",     query: "chennai",     lat: 13.08,  lng: 80.27  },
  { name: "Hyderabad",   query: "hyderabad",   lat: 17.38,  lng: 78.49  },
  { name: "Pune",        query: "pune",        lat: 18.52,  lng: 73.86  },
  { name: "Beijing",     query: "beijing",     lat: 39.90,  lng: 116.40 },
  { name: "Shanghai",    query: "shanghai",    lat: 31.23,  lng: 121.47 },
  { name: "London",      query: "london",      lat: 51.51,  lng: -0.13  },
  { name: "Paris",       query: "paris",       lat: 48.85,  lng: 2.35   },
  { name: "Berlin",      query: "berlin",      lat: 52.52,  lng: 13.40  },
  { name: "New York",    query: "new york",    lat: 40.71,  lng: -74.01 },
  { name: "Los Angeles", query: "los angeles", lat: 34.05,  lng: -118.24},
  { name: "Tokyo",       query: "tokyo",       lat: 35.68,  lng: 139.69 },
  { name: "Dubai",       query: "dubai",       lat: 25.20,  lng: 55.27  },
  { name: "Singapore",   query: "singapore",   lat: 1.35,   lng: 103.82 },
  { name: "Bangkok",     query: "bangkok",     lat: 13.75,  lng: 100.50 },
  { name: "Lahore",      query: "lahore",      lat: 31.55,  lng: 74.34  },
  { name: "Dhaka",       query: "dhaka",       lat: 23.81,  lng: 90.41  },
  { name: "Karachi",     query: "karachi",     lat: 24.86,  lng: 67.01  },
  { name: "Cairo",       query: "cairo",       lat: 30.06,  lng: 31.24  },
  { name: "Jakarta",     query: "jakarta",     lat: -6.21,  lng: 106.84 },
  { name: "Sydney",      query: "sydney",      lat: -33.87, lng: 151.21 },
  { name: "Toronto",     query: "toronto",     lat: 43.65,  lng: -79.38 },
  { name: "Sao Paulo",   query: "sao paulo",   lat: -23.55, lng: -46.63 },
  { name: "Mexico City", query: "mexico city", lat: 19.43,  lng: -99.13 },
];

// Fetch real AQI for one city from WAQI
// Tries by city name first, falls back to geo coordinates
async function fetchCityAQI(city) {
  try {
    const res = await getCityAQI(city.query);
    if (res && res.status === "ok" && res.data && typeof res.data.aqi === "number") {
      const d = res.data;
      return {
        ...city,
        aqi:         d.aqi,
        pm25:        d.iaqi?.pm25?.v ?? null,
        pm10:        d.iaqi?.pm10?.v ?? null,
        no2:         d.iaqi?.no2?.v  ?? null,
        co:          d.iaqi?.co?.v   ?? null,
        so2:         d.iaqi?.so2?.v  ?? null,
        stationName: d.city?.name ?? city.name,
        loaded: true,
      };
    }
    // Fallback to geo lookup
    const geoRes = await getAQIByCoords(city.lat, city.lng);
    if (geoRes && geoRes.status === "ok" && geoRes.data && typeof geoRes.data.aqi === "number") {
      const d = geoRes.data;
      return {
        ...city,
        aqi:         d.aqi,
        pm25:        d.iaqi?.pm25?.v ?? null,
        pm10:        d.iaqi?.pm10?.v ?? null,
        no2:         d.iaqi?.no2?.v  ?? null,
        co:          d.iaqi?.co?.v   ?? null,
        stationName: d.city?.name ?? city.name,
        loaded: true,
      };
    }
  } catch (err) {
    // API call failed for this city — skip silently
  }
  // Mark as loaded but with no data
  return { ...city, aqi: null, loaded: true };
}

function GlobalMap() {
  const [cities, setCities] = useState(
    CITY_LIST.map(c => ({ ...c, aqi: null, loaded: false }))
  );
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [flyTo, setFlyTo]               = useState(null);
  const [searching, setSearching]       = useState(false);

  // ── Load all cities on mount in small batches ──
  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const BATCH = 3;   // cities per batch
      const WAIT  = 700; // ms between batches (respect rate limits)

      for (let i = 0; i < CITY_LIST.length; i += BATCH) {
        if (cancelled) return;

        const batch   = CITY_LIST.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(fetchCityAQI));

        if (!cancelled) {
          setCities(prev => {
            const next = [...prev];
            results.forEach(r => {
              const idx = next.findIndex(c => c.name === r.name);
              if (idx !== -1) next[idx] = r;
            });
            return next;
          });
        }

        if (i + BATCH < CITY_LIST.length) {
          await new Promise(r => setTimeout(r, WAIT));
        }
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // ── Search any city ──
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);

    const data = await getCityAQI(searchQuery);
    if (data && data.status === "ok" && data.data) {
      const d = data.data;
      const result = {
        name:        d.city?.name || searchQuery,
        stationName: d.city?.name || searchQuery,
        lat:         d.city?.geo?.[0],
        lng:         d.city?.geo?.[1],
        aqi:         d.aqi,
        pm25:        d.iaqi?.pm25?.v ?? null,
        pm10:        d.iaqi?.pm10?.v ?? null,
        no2:         d.iaqi?.no2?.v  ?? null,
        co:          d.iaqi?.co?.v   ?? null,
        so2:         d.iaqi?.so2?.v  ?? null,
      };
      setSearchResult(result);
      setSelectedCity(result);
      if (result.lat && result.lng) setFlyTo([result.lat, result.lng]);
    } else {
      alert("City not found. Try: Delhi, Mumbai, Beijing, London, Tokyo...");
    }
    setSearching(false);
  };

  const loadedCount = cities.filter(c => c.loaded).length;
  const allLoaded   = loadedCount === CITY_LIST.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-blue-900/20 flex-shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Global AQI Map</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400 text-sm">Live data from WAQI global network</p>
            {!allLoaded ? (
              <span className="flex items-center gap-1.5 text-xs text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Fetching {loadedCount}/{CITY_LIST.length} cities...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                {CITY_LIST.length} cities live ✓
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="air-input pl-10 w-56"
              placeholder="Search any city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" disabled={searching}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm">
            {searching ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
            Search
          </button>
        </form>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "100%", width: "100%", background: "#020817" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
          />

          {flyTo && <FlyToCity coords={flyTo} />}

          {/* Grey placeholder markers for cities still loading */}
          {cities.filter(c => !c.loaded).map(city => (
            <CircleMarker
              key={`loading-${city.name}`}
              center={[city.lat, city.lng]}
              radius={6}
              pathOptions={{ color: "#374151", fillColor: "#374151", fillOpacity: 0.5, weight: 1 }}
            >
              <Popup>
                <div style={{ background: "#0a1628", color: "#9ca3af", padding: "10px", borderRadius: "10px", fontSize: 12 }}>
                  <p style={{ fontWeight: 600 }}>{city.name}</p>
                  <p>⏳ Fetching live AQI...</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Real AQI markers — each with its own live color and size */}
          {cities.filter(c => c.loaded && c.aqi !== null).map(city => {
            const color  = getAQIColor(city.aqi);
            const label  = getAQILabel(city.aqi);
            // Radius proportional to AQI so worse cities are visually larger
            const radius = Math.max(8, Math.min(22, city.aqi / 12));

            return (
              <CircleMarker
                key={city.name}
                center={[city.lat, city.lng]}
                radius={radius}
                pathOptions={{
                  color,
                  fillColor:   color,
                  fillOpacity: 0.78,
                  weight:      2,
                  opacity:     1,
                }}
                eventHandlers={{ click: () => setSelectedCity(city) }}
              >
                <Popup>
                  <div style={{
                    background: "#0a1628", color: "#e2e8f0",
                    borderRadius: 12, padding: 14,
                    minWidth: 175, border: `1px solid ${color}50`,
                  }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                      {city.stationName || city.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>
                        {city.aqi}
                      </span>
                      <div>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>AQI</p>
                        <p style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
                      {[["PM2.5", city.pm25], ["PM10", city.pm10], ["NO₂", city.no2], ["CO", city.co]].map(
                        ([l, v]) => v != null && (
                          <div key={l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "3px 8px" }}>
                            <span style={{ color: "#6b7280" }}>{l}: </span>
                            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{Number(v).toFixed(1)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Searched city — always shown with white border */}
          {searchResult?.lat && (
            <CircleMarker
              center={[searchResult.lat, searchResult.lng]}
              radius={20}
              pathOptions={{
                color: "#ffffff",
                fillColor: getAQIColor(searchResult.aqi),
                fillOpacity: 0.85,
                weight: 3,
              }}
            >
              <Popup>
                <div style={{
                  background: "#0a1628", color: "#e2e8f0",
                  borderRadius: 12, padding: 16,
                  minWidth: 210, border: "1px solid rgba(255,255,255,0.3)",
                }}>
                  <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                    📍 {searchResult.stationName || searchResult.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 42, fontWeight: 800, color: getAQIColor(searchResult.aqi), lineHeight: 1 }}>
                      {searchResult.aqi}
                    </span>
                    <div>
                      <p style={{ fontSize: 11, color: "#9ca3af" }}>AQI (Live)</p>
                      <p style={{ fontSize: 13, color: getAQIColor(searchResult.aqi), fontWeight: 600 }}>
                        {getAQILabel(searchResult.aqi)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, fontSize: 11 }}>
                    {[["PM2.5", searchResult.pm25], ["PM10", searchResult.pm10],
                      ["NO₂", searchResult.no2], ["CO", searchResult.co],
                      ["SO₂", searchResult.so2]].map(
                      ([l, v]) => v != null && (
                        <div key={l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "4px 8px" }}>
                          <span style={{ color: "#6b7280" }}>{l}: </span>
                          <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{Number(v).toFixed(1)}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>

        {/* AQI Legend */}
        <div className="absolute bottom-5 left-5 glass-card p-4 z-[1000]">
          <p className="text-white text-xs font-semibold mb-3 flex items-center gap-2">
            <FiInfo /> AQI Scale
          </p>
          <div className="space-y-1.5">
            {[
              { range: "0–50",    label: "Good",             color: "#22c55e" },
              { range: "51–100",  label: "Moderate",         color: "#eab308" },
              { range: "101–150", label: "Unhealthy (Sens)", color: "#f97316" },
              { range: "151–200", label: "Unhealthy",        color: "#ef4444" },
              { range: "201–300", label: "Very Unhealthy",   color: "#a855f7" },
              { range: "300+",    label: "Hazardous",        color: "#7f1d1d" },
            ].map(({ range, label, color }) => (
              <div key={range} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-gray-300 text-xs">{range} – {label}</span>
              </div>
            ))}
          </div>
          {/* Loading progress bar */}
          {!allLoaded && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Loading</span>
                <span>{loadedCount}/{CITY_LIST.length}</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(loadedCount / CITY_LIST.length) * 100}%`,
                    background: "linear-gradient(90deg, #22c55e, #3b82f6)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Selected city side panel */}
        {selectedCity && (
          <div className="absolute top-5 right-5 glass-card p-5 z-[1000] w-72 fade-in-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-display font-bold text-lg leading-tight">
                {selectedCity.stationName || selectedCity.name}
              </h3>
              <button
                onClick={() => setSelectedCity(null)}
                className="text-gray-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-all flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex items-end gap-3 mb-3">
              <span
                className="font-display font-black"
                style={{ fontSize: "3.5rem", lineHeight: 1, color: getAQIColor(selectedCity.aqi) }}
              >
                {selectedCity.aqi}
              </span>
              <div className="mb-1">
                <p className="text-white font-semibold">{getAQILabel(selectedCity.aqi)}</p>
                <p className="text-gray-500 text-xs">Real-time AQI</p>
              </div>
            </div>

            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((selectedCity.aqi / 300) * 100, 100)}%`,
                  background: `linear-gradient(90deg, #22c55e, ${getAQIColor(selectedCity.aqi)})`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[["PM2.5", selectedCity.pm25], ["PM10", selectedCity.pm10],
                ["NO₂", selectedCity.no2], ["CO", selectedCity.co]].map(([l, v]) => (
                <div key={l} className="bg-white/5 rounded-xl p-2 text-center">
                  <p className="text-gray-400 text-xs">{l}</p>
                  <p className="text-white font-mono font-bold text-sm">
                    {v != null ? Number(v).toFixed(1) : "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* Estimated source breakdown */}
            <div className="space-y-1.5">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Estimated Sources</p>
              {[
                { label: "Traffic",      pct: 40, color: "#ef4444" },
                { label: "Industry",     pct: 30, color: "#f97316" },
                { label: "Construction", pct: 20, color: "#eab308" },
                { label: "Weather/Dust", pct: 10, color: "#3b82f6" },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                    <span>{label}</span><span>{pct}%</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalMap;
