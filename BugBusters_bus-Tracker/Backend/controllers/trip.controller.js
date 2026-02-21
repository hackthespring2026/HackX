import tripModel from "../models/Trip.model.js";
import busModel from "../models/Bus.model.js";
import routeModel from "../models/Route.model.js";

const createTrip = async (req, res) => {
  try {
    const { busId, routeId, crew } = req.body;

    if (!busId || !routeId) {
      return res
        .status(400)
        .json({ success: false, msg: "busId and routeId required" });
    }

    const bus = await busModel.findById(busId);
    if (!bus)
      return res.status(404).json({ success: false, msg: "Bus not found" });

    const active = await tripModel.findOne({ busId, status: "running" });
    if (active) {
      return res
        .status(400)
        .json({ success: false, msg: "Bus already running trip" });
    }

    const route = await routeModel.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, msg: "Route not found" });
    }

    const startLocation = route?.stops?.length
      ? route.stops[0]
      : route?.path?.length
        ? route.path[0]
        : null;

    if (!startLocation) {
      return res.status(400).json({
        success: false,
        msg: "Route has no coordinates",
      });
    }

    const trip = await tripModel.create({
      busId,
      routeId,
      crew,
      status: "running",
      nextStopIndex: 0,
    });

    bus.currentLocation = {
      lat: startLocation.lat,
      lng: startLocation.lng,
    };

    bus.speed = 0;
    bus.status = "running";

    await bus.save();

    res.status(201).json({
      success: true,
      data: trip
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getActiveTrips = async (req, res) => {
  const trips = await tripModel
    .find({ status: "running" })
    .populate("busId")
    .populate("routeId");

  res.json(trips);
};

const getTripById = async (req, res) => {
  const trip = await tripModel
    .findById(req.params.id)
    .populate("busId")
    .populate("routeId");

  if (!trip)
    return res.status(404).json({ success: false, msg: "Trip not found" });
  res.json(trip);
};

const endTrip = async (req, res) => {
  const trip = await tripModel.findById(req.params.id);
  if (!trip)
    return res.status(404).json({ success: false, msg: "Trip not found" });

  trip.status = "completed";
  await trip.save();

  // mark bus idle
  const bus = await busModel.findById(trip.busId);
  if (bus) {
    bus.status = "idle";
    await bus.save();
  }

  res.json({ success: true, msg: "Trip ended" });
};

export { createTrip, getActiveTrips, getTripById, endTrip };
