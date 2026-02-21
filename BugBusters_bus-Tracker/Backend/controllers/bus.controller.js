import busModel from "../models/Bus.model.js";

const createBus = async (req, res) => {

  try {
    const { busNumber } = req.body;

    if (!busNumber) {
      return res.status(400).json({ success:false , msg: "busNumber required" });
    }

    const exists = await busModel.findOne({ busNumber });
    if (exists) {
      return res.status(400).json({ success:false, msg: "Bus already exists" });
    }

    const bus = await busModel.create({ busNumber });
    res.status(201).json({ success:true, data: bus });

  } catch (err) {
    res.status(500).json({ success:false, error: err.message });
  }
};

const getAllBuses = async (req, res) => {
  const buses = await busModel.find();
  res.json({ success:true, data: buses });
};

const getBusById = async (req, res) => {
  const { id } = req.params;
  const bus = await busModel.findById(id);
  if (!bus) return res.status(404).json({ success:false, msg: "Bus not found" });
  res.json({ success:true, data: bus });
};

const updateBus = async (req, res) => {
  const { busNumber, status } = req.body;

  const bus = await busModel.findById(req.params.id);
  if (!bus) return res.status(404).json({ success:false, msg: "Bus not found" });

  if (busNumber !== undefined) bus.busNumber = busNumber;
  if (status !== undefined) bus.status = status;

  await bus.save();

  res.json({ success:true, data: bus });
};


const deleteBus = async (req, res) => {
  const bus = await busModel.findByIdAndDelete(req.params.id);
  if (!bus) return res.status(404).json({ success:false, msg: "Bus not found" });
  res.json({ success:true, msg: "Bus deleted" });
};

export { createBus, getAllBuses, getBusById, updateBus, deleteBus };