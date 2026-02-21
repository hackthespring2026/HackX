import React, { useEffect, useState } from "react";
import { addTrip, getBuses, getRoutes } from "../services/adminApi";

const AddTrip = () => {
  const [form, setForm] = useState({
    busId: "",
    routeId: "",
    crew: ""
  });

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const busRes = await getBuses();
      const routeRes = await getRoutes();

      setBuses(busRes.data.data);
      setRoutes(routeRes.data.data);
    } catch (err) {
      console.log("Error fetching buses/routes");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTrip(form);
      alert("Trip added successfully");
      setForm({ busId: "", routeId: "", crew: "" });
    } catch (err) {
      alert(err.response?.data?.msg || "Error adding trip");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Add New Trip
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Bus Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Select Bus
            </label>
            <select
              name="busId"
              value={form.busId}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Bus</option>
              {buses.map((bus) => (
                <option key={bus._id} value={bus._id}>
                  {bus.busNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Route Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Select Route
            </label>
            <select
              name="routeId"
              value={form.routeId}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Route</option>
              {routes.map((route) => (
                <option key={route._id} value={route._id}>
                  {route.routeName}
                </option>
              ))}
            </select>
          </div>

          {/* Crew */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Crew
            </label>
            <input
              name="crew"
              value={form.crew}
              onChange={handleChange}
              placeholder="Enter crew name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
          >
            Add Trip
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTrip;