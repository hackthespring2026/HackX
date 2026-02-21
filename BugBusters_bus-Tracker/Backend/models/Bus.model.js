import mongoose from "mongoose";

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },

  status: { 
    type: String,
    enum: ["idle", "running", "stopped", "offline"],
    default: "idle"
  },

  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  speed: {
    type: Number,
    default: 30
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const busModel = mongoose.model("Bus", busSchema);
export default busModel;