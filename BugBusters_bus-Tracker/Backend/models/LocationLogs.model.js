import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  busId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Bus",
    required: true
  },

  lat: { type: Number, required: true },
  lng: { type: Number, required: true },

  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});


logSchema.index({ busId: 1, timestamp: -1 });

const locationLogModel = mongoose.model("LocationLog", logSchema);
export default locationLogModel;