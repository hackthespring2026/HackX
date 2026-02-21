import React, { useState } from "react";
import { addRoute } from "../services/adminApi";

const AddRoute = () => {
  const [form, setForm] = useState({
    routeName: "",
    distance: "",
    stops: [{ name: "", lat: "", lng: "" }],
    path: [{ lat: "", lng: "" }],
  });

  const handleBasicChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleStopChange = (index, value) => {
    const updatedStops = [...form.stops];
    updatedStops[index] = value;
    setForm({ ...form, stops: updatedStops });
  };

  const addStop = () => {
    setForm({ ...form, stops: [...form.stops, ""] });
  };

  const removeStop = (index) => {
    const updatedStops = form.stops.filter((_, i) => i !== index);
    setForm({ ...form, stops: updatedStops });
  };

  const handlePathChange = (index, field, value) => {
    const updatedPath = [...form.path];
    updatedPath[index][field] = value;
    setForm({ ...form, path: updatedPath });
  };

  const addPathPoint = () => {
    setForm({ ...form, path: [...form.path, { lat: "", lng: "" }] });
  };

  const removePathPoint = (index) => {
    const updatedPath = form.path.filter((_, i) => i !== index);
    setForm({ ...form, path: updatedPath });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const cleanedForm = {
        ...form,
        distance: Number(form.distance),
        stops: form.stops
          .filter(s => s.name && s.lat && s.lng)
          .map(s => ({
            name: s.name,
            lat: parseFloat(s.lat),
            lng: parseFloat(s.lng)
          })),
      };

      await addRoute(cleanedForm);

      alert("Route added successfully");

      setForm({
        routeName: "",
        distance: "",
        stops: [""],
        path: [{ lat: "", lng: "" }],
      });

    } catch (err) {
      alert(err.response?.data?.msg || "Error adding route");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Add New Route
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Route Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Route Name
            </label>
            <input
              name="routeName"
              value={form.routeName}
              onChange={handleBasicChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Distance (km)
            </label>
            <input
              name="distance"
              type="number"
              value={form.distance}
              onChange={handleBasicChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Stops Section */}
          <div>
            <h3 className="font-semibold mb-2">Stops</h3>

            {form.stops.map((stop, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  placeholder="Stop Name"
                  value={stop.name || ""}
                  onChange={(e) => {
                    const updated = [...form.stops];
                    updated[index].name = e.target.value;
                    setForm({ ...form, stops: updated });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />

                <input
                  type="number"
                  placeholder="Lat"
                  value={stop.lat || ""}
                  onChange={(e) => {
                    const updated = [...form.stops];
                    updated[index].lat = e.target.value;
                    setForm({ ...form, stops: updated });
                  }}
                  className="w-28 px-2 py-2 border rounded-lg"
                />

                <input
                  type="number"
                  placeholder="Lng"
                  value={stop.lng || ""}
                  onChange={(e) => {
                    const updated = [...form.stops];
                    updated[index].lng = e.target.value;
                    setForm({ ...form, stops: updated });
                  }}
                  className="w-28 px-2 py-2 border rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => {
                    const updated = form.stops.filter((_, i) => i !== index);
                    setForm({ ...form, stops: updated });
                  }}
                  className="px-3 bg-red-500 text-white rounded-lg"
                >
                  X
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  stops: [...form.stops, { name: "", lat: "", lng: "" }]
                })
              }
              className="text-indigo-600 font-medium mt-2"
            >
              + Add Stop
            </button>
          </div>

          {/* Path Section */}
          <div>
            <h3 className="font-semibold mb-2">Path Coordinates</h3>
            {form.path.map((point, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Latitude"
                  value={point.lat}
                  onChange={(e) =>
                    handlePathChange(index, "lat", e.target.value)
                  }
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Longitude"
                  value={point.lng}
                  onChange={(e) =>
                    handlePathChange(index, "lng", e.target.value)
                  }
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePathPoint(index)}
                  className="px-3 bg-red-500 text-white rounded-lg"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPathPoint}
              className="text-indigo-600 font-medium mt-2"
            >
              + Add Coordinate
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Save Route
          </button>

        </form>
      </div>
    </div>
  );
};

export default AddRoute;