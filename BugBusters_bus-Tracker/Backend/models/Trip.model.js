import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  busId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Bus",
    required: true
  },

  routeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Route",
    required: true
  },

  startTime: { 
    type: Date, 
    default: Date.now 
  },

  status: { 
    type: String,
    enum: ["running", "completed", "cancelled"],
    default: "running"
  },

  crew: {
    driverName: String,
    driverPhone: String,
    conductorName: String,
    conductorPhone: String
  },

  currentStopIndex: { type: Number, default: 0 },
  nextStopIndex: { type: Number, default: 1 },

  delayMinutes: { type: Number, default: 0 }
});

const tripModel = mongoose.model("Trip", tripSchema);
export default tripModel;