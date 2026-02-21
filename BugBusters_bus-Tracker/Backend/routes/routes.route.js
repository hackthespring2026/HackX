import express from "express";
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
} from "../controllers/route.controller.js";
import { verifyAdmin } from "../middlewear/auth.middlewear.js";

const routeRouter = express.Router();

routeRouter.post("/", verifyAdmin, createRoute);
routeRouter.get("/", getAllRoutes);
routeRouter.get("/:id", getRouteById);
routeRouter.put("/:id", verifyAdmin, updateRoute);
routeRouter.delete("/:id", verifyAdmin, deleteRoute);

export default routeRouter;