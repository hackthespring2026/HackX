import express from "express";
import { updateLocation } from "../controllers/location.controller.js";

const locationRouter = express.Router();

locationRouter.post("/update", updateLocation);

export default locationRouter;