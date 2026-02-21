import express from "express";
import { searchBusByNumber } from "../controllers/clinetSearch.controller.js";

const clientSearchRouter = express.Router();

clientSearchRouter.get("/number/:busNumber", searchBusByNumber);

export default clientSearchRouter;