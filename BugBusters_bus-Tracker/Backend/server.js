import express from "express";
import 'dotenv/config';
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

import busRouter from "./routes/bus.route.js";
import routeRouter from "./routes/routes.route.js";
import tripRouter from "./routes/trip.route.js";
import locationRouter from "./routes/location.route.js";
import adminRouter from "./routes/admin.route.js";
import clientSearchRouter from "./routes/clientSearch.route.js";




const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// socket.io setup
const server = http.createServer(app);


const io = new Server(server, {
  cors: { origin: "*" }
});

app.set("io", io);  


// connect to database
connectDB();

// routes
app.use("/api/bus", busRouter);
app.use("/api/route", routeRouter);
app.use("/api/trip", tripRouter);
app.use("/api/location", locationRouter );
app.use("/api/admin", adminRouter);
app.use("/api/search", clientSearchRouter);


io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinTrip", (tripId) => {
    socket.join(tripId);
    console.log(`Socket ${socket.id} joined trip ${tripId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on port", PORT));

