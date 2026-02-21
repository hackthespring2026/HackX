import busModel from "../models/Bus.model.js";
import locationLogModel from "../models/LocationLogs.model.js";
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


const updateLocation = async (req, res) => {
  try {
    const { tripId, lat, lng, speed } = req.body;

    if (!tripId || lat === undefined || lng === undefined) {
      return res
        .status(400)
        .json({ success: false, msg: "tripId, lat, lng required" });
    }

    const trip = await tripModel.findById(tripId).populate("routeId");
    if (!trip) {
      return res.status(404).json({ success: false, msg: "Trip not found" });
    }

    const busId = trip.busId;

    const bus = await busModel.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, msg: "Bus not found" });
    }

    bus.currentLocation = { lat, lng };
    if (speed !== undefined) bus.speed = speed;
    bus.lastUpdated = new Date();
    bus.status = "running";
    await bus.save();


    await locationLogModel.create({
      busId,
      lat,
      lng,
    });


    let nextStop = null;

    if (trip.routeId?.stops?.length) {
      const stops = trip.routeId.stops;

      const newIndex = getNextStopIndex(
        { lat, lng },
        stops,
        trip.nextStopIndex || 0,
      );

      trip.nextStopIndex = newIndex;
      await trip.save();

      const stop = stops[newIndex];

      const result = calcETA({ lat, lng }, stop, speed || bus.speed || 30);
      console.log( result);
      
      nextStop = {
        name: stop.name,
        index: newIndex,
        eta: result ? `${result.eta} mins` : null,
        distance: result ? `${result.distance} km` : null,
      };
      console.log(nextStop);
      
    }

    const io = req.app.get("io");
    if (io) {
      io.to(tripId).emit("busLocationUpdate", {
        busId: busId.toString(),
        lat,
        lng,
        speed: speed || bus.speed,
        nextStop,
      });
    }

    res.json({ success: true, msg: "Location updated", nextStop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export { updateLocation };