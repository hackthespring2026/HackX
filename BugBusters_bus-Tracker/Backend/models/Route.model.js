import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
});

const routeSchema = new mongoose.Schema({
  routeName: { type: String, required: true },

  stops: [stopSchema],

  path: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  ],

  distance: { type: Number, default: 0 }
});

const routeModel = mongoose.model("Route", routeSchema);
export default routeModel;