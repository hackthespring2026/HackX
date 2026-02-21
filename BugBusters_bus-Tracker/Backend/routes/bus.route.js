import express from "express";
import {
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus
} from "../controllers/bus.controller.js";
import { verifyAdmin } from "../middlewear/auth.middlewear.js";

const busRouter = express.Router();

busRouter.post("/", verifyAdmin, createBus);
busRouter.get("/", getAllBuses);
busRouter.get("/:id", getBusById);
busRouter.put("/:id", verifyAdmin, updateBus);
busRouter.delete("/:id", verifyAdmin, deleteBus);

export default busRouter;