import axios from "axios";
import routePath from "./path.js";

const BACKEND_URL = "http://localhost:5000/api/location/update";

const TRIP_ID = "6998d39534ac3499e689ed80";

const intervalMs = 1000;      
const stepsBetweenPoints = 1; 


const path = routePath;


function haversineDistance(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

let segment = 0;
let step = 0;

console.log("🚍 Bus simulator started");

setInterval(async () => {
  const start = path[segment];
  const end = path[(segment + 1) % path.length];

  
  const lat = start.lat + ((end.lat - start.lat) * step) / stepsBetweenPoints;
  const lng = start.lng + ((end.lng - start.lng) * step) / stepsBetweenPoints;

  const current = { lat, lng };

  const nextLat =
    start.lat + ((end.lat - start.lat) * (step + 1)) / stepsBetweenPoints;
  const nextLng =
    start.lng + ((end.lng - start.lng) * (step + 1)) / stepsBetweenPoints;

  const next = { lat: nextLat, lng: nextLng };


  const distKm = haversineDistance(current, next);
  let speed = distKm * 3600;

  if (segment % 15 === 0) speed *= 0.4;

  speed = Math.max(10, Math.min(speed, 80));

  try {
    await axios.post(BACKEND_URL, {
      tripId: TRIP_ID,
      lat,
      lng,
      speed: Math.round(speed)-10
    });

    console.log(
      `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)} | 🚍 ${Math.round(speed)} km/h`
    );
  } catch (err) {
    console.error("Failed:", err.message);
  }

  step++;

  if (step > stepsBetweenPoints) {
    step = 0;
    segment = (segment + 1) % path.length;
  }
}, intervalMs);