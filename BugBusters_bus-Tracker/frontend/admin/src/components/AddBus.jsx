import React, { useState } from "react";
import { addBus } from "../services/adminApi";

const AddBus = () => {
  const [form, setForm] = useState({
    busNumber: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addBus(form);
      alert("Bus added successfully");
      setForm({ busNumber: "" });
    } catch (err) {
      if (err.response?.data?.error?.includes("duplicate key")) {
        alert("Bus number already exists!");
      } else {
        alert(err.response?.data?.message || "Something went wrong");
      }
    }
  };

  return (
    <div className="p-6">

      <div className="bg-white shadow-lg rounded-xl max-w-md p-6">
        
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Add New Bus
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Bus Number
            </label>

            <input
              name="busNumber"
              value={form.busNumber}
              onChange={handleChange}
              placeholder="Enter bus number"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            Add Bus
          </button>

        </form>
      </div>

    </div>
  );
};

export default AddBus;