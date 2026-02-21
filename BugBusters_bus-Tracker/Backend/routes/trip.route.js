import express from "express";
import {
  createTrip,
  getActiveTrips,
  getTripById,
  endTrip
} from "../controllers/trip.controller.js";
import { verifyAdmin } from "../middlewear/auth.middlewear.js";

const tripRouter = express.Router();

tripRouter.post("/", verifyAdmin, createTrip);
tripRouter.get("/active", getActiveTrips);
tripRouter.get("/:id", getTripById);
tripRouter.put("/:id/end", verifyAdmin, endTrip);

export default tripRouter;