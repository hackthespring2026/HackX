import React, { useState } from "react";
import { FiNavigation, FiWind, FiClock } from "react-icons/fi";
import { getCityAQI, getAQIColor } from "../utils/api";

function generateRoutes(startAqi, endAqi) {
  const avgAqi = (startAqi + endAqi) / 2;

  const routes = [
    {
      name: "Fastest Route",
      distance: "12.4 km",
      time: 18,
      multiplier: 1.25,
      via: "Main Highway → Industrial Zone",
    },
    {
      name: "Balanced Route",
      distance: "13.2 km",
      time: 20,
      multiplier: 1.0,
      via: "City Center → Mall Road",
    },
    {
      name: "Cleanest Air Route ✨",
      distance: "14.1 km",
      time: 23,
      multiplier: 0.65,
      via: "Park Road → Residential → Greenway",
    },
  ];

  return routes.map((route) => {
    const calculatedAqi = Math.round(avgAqi * route.multiplier);

    return {
      ...route,
      aqi: calculatedAqi,
      color: getAQIColor(calculatedAqi),
      pollution:
        calculatedAqi <= 100
          ? "Low"
          : calculatedAqi <= 160
          ? "Moderate"
          : "High",
      recommended: route.multiplier === 0.65,
    };
  });
}

function SafeRoute() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFind = async (e) => {
    e.preventDefault();
    if (!start || !destination) return;

    setLoading(true);
    setError("");
    setRoutes(null);

    try {
      const [startData, destData] = await Promise.all([
        getCityAQI(start),
        getCityAQI(destination),
      ]);

      if (
        startData?.status !== "ok" ||
        destData?.status !== "ok"
      ) {
        throw new Error("AQI API failed");
      }

      const startAqi = startData.data.aqi;
      const destAqi = destData.data.aqi;

      const generatedRoutes = generateRoutes(startAqi, destAqi);

      setRoutes({
        routes: generatedRoutes,
        startAqi,
        destAqi,
      });
    } catch (err) {
      console.error(err);
      setError("⚠️ Unable to fetch AQI. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">
          Safe Route Navigator
        </h1>
        <p className="text-gray-400 text-sm">
          Compare routes based on real-time air quality
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleFind} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="air-input"
              placeholder="Starting City"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
            <input
              className="air-input"
              placeholder="Destination City"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-3"
          >
            {loading ? "Finding Routes..." : "Find Safe Routes"}
          </button>
        </form>
      </div>

      {error && (
        <div className="text-red-400 font-semibold">
          {error}
        </div>
      )}

      {routes && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="text-gray-400 text-xs">Origin AQI</p>
              <p
                className="text-4xl font-bold"
                style={{ color: getAQIColor(routes.startAqi) }}
              >
                {routes.startAqi}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-gray-400 text-xs">Destination AQI</p>
              <p
                className="text-4xl font-bold"
                style={{ color: getAQIColor(routes.destAqi) }}
              >
                {routes.destAqi}
              </p>
            </div>
          </div>

          {routes.routes.map((route, i) => (
            <div
              key={i}
              className="glass-card p-5"
              style={{ borderColor: `${route.color}30` }}
            >
              <h3 className="text-white font-semibold text-lg">
                {route.name}
              </h3>
              <p className="text-gray-400 text-sm">
                {route.via}
              </p>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <FiNavigation className="mx-auto text-blue-400" />
                  <p>{route.distance}</p>
                </div>
                <div className="text-center">
                  <FiClock className="mx-auto text-purple-400" />
                  <p>{route.time} min</p>
                </div>
                <div className="text-center">
                  <FiWind
                    className="mx-auto"
                    style={{ color: route.color }}
                  />
                  <p
                    className="font-bold"
                    style={{ color: route.color }}
                  >
                    {route.aqi}
                  </p>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-400">
                Pollution Level:
                <span
                  className="ml-2 font-semibold"
                  style={{ color: route.color }}
                >
                  {route.pollution}
                </span>
              </div>

              {route.recommended && (
                <div className="mt-2 text-green-400 text-sm font-semibold">
                  ✅ Recommended Cleanest Route
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SafeRoute;