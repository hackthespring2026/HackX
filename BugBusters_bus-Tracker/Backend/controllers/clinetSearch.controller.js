import busModel from "../models/Bus.model.js";
import tripModel from "../models/Trip.model.js";


function calcETA(current, stop, speedKmph = 30) {
  if (!current || !stop) return null;

  const R = 6371;
  const dLat = ((stop.lat - current.lat) * Math.PI) / 180;
  const dLng = ((stop.lng - current.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((current.lat * Math.PI) / 180) *
      Math.cos((stop.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const speedKmPerMin = speedKmph / 60;

  const etaMin = Math.round(distanceKm / speedKmPerMin);

  return {
    eta: etaMin,
    distance: Number(distanceKm.toFixed(2))
  };
}

function getNextStopIndex(current, stops, startIndex = 0) {
  if (!current || !stops?.length) return startIndex;

  let minDist = Infinity;
  let nextIndex = startIndex;

  for (let i = startIndex; i < stops.length; i++) {
    const dLat = stops[i].lat - current.lat;
    const dLng = stops[i].lng - current.lng;
    const dist = dLat * dLat + dLng * dLng;

    if (dist < minDist) {
      minDist = dist;
      nextIndex = i;
    }
  }
  return nextIndex;
}
const searchBusByNumber = async (req, res) => {
  try {
    const input = req.params.busNumber
      .toUpperCase()
      .replace(/[\s-]/g, "");

    const bus = await busModel.findOne({ busNumber: input });

    if (!bus) {
      return res.status(404).json({
        success: false,
        msg: "Bus not found"
      });
    }

    const trip = await tripModel.findOne({
      busId: bus._id,
      status: "running"
    }).populate("routeId");

    let routeStops = trip?.routeId?.stops || [];
    let nextStopData = null;

    if (trip && bus.currentLocation && routeStops.length > 0) {

      const nextIndex = getNextStopIndex(
        bus.currentLocation,
        routeStops,
        trip.nextStopIndex || 0
      );

      if (nextIndex !== trip.nextStopIndex) {
        trip.nextStopIndex = nextIndex;
        await trip.save();
      }

      const stop = routeStops[nextIndex];

      const etaResult = calcETA(
        bus.currentLocation,
        stop,
        bus.speed || 30
      );

      nextStopData = {
        name: stop.name,
        index: nextIndex,
        eta: etaResult ? `${etaResult.eta} mins` : null,
        distance: etaResult ? `${etaResult.distance} km` : null
      };
    }

    const response = {
      busId: bus._id,
      busNumber: bus.busNumber,
      status: bus.status,
      speed: bus.speed,
      currentLocation: bus.currentLocation,
      tripId: trip?._id || null,
      crew: trip?.crew || null,
      route: routeStops,
      nextStop: nextStopData
    };

    if (!trip) {
  return res.json({
    success: true,
    data: {
      ...bus.toObject(),
      tripId: null,
      route: [],
      nextStop: null,
      msg: "Bus not currently running"
    }
  });
}

    res.json({
      success: true,
      data: response
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

export { searchBusByNumber };