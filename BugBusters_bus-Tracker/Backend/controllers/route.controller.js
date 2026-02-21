import routeModel from "../models/Route.model.js";

const createRoute = async (req, res) => {

  try {
    const { routeName, stops, path, distance } = req.body;

    if (!routeName) {
      return res.status(400).json({ success:false, msg: "routeName required" });
    }

    const route = await routeModel.create({
      routeName,
      stops,
      path,
      distance
    });

    res.status(201).json({ success:true, data: route });

  }
  // catch (err) {
  //   res.status(500).json({ success:false, error: err.message });
  // }
  catch (err) {
  console.log("CREATE ROUTE ERROR:", err); // 👈 add this
  res.status(500).json({ success:false, error: err.message });
}
};

const getAllRoutes = async (req, res) => {
  const routes = await routeModel.find();
  res.json({ success:true, data: routes });
};

const getRouteById = async (req, res) => {
  const route = await routeModel.findById(req.params.id);
  if (!route) return res.status(404).json({ success:false, msg: "Route not found" });
  res.json({ success:true, data: route });
};


const updateRoute = async (req, res) => {
  try {
    const route = await routeModel.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success:false, msg: "Route not found" });
    }

    const { routeName, stops, path, distance } = req.body;

    if (routeName !== undefined) route.routeName = routeName;
    if (stops !== undefined) route.stops = stops;
    if (path !== undefined) route.path = path;
    if (distance !== undefined) route.distance = distance;

    await route.save();

    res.json({ success:true, data: route });

  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
};

const deleteRoute = async (req, res) => {
  const route = await routeModel.findByIdAndDelete(req.params.id);
  if (!route) return res.status(404).json({ success:false, msg: "Route not found" });
  res.json({ success:true, msg: "Route deleted" });
};

export { createRoute, getAllRoutes, getRouteById, updateRoute, deleteRoute };