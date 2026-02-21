import React, { useState } from "react";
import axios from "axios";

function EditBus() {
  const [id, setId] = useState("");
  const [busNumber, setBusNumber] = useState("");
  const [status, setStatus] = useState("");

  const handleUpdate = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/bus/${id}`,
        { busNumber, status }
      );

      alert("Bus Updated");
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Bus</h2>

      <div className="space-y-3">
        <input
          placeholder="Bus ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="border p-2 block"
        />

        <input
          placeholder="New Bus Number"
          value={busNumber}
          onChange={(e) => setBusNumber(e.target.value)}
          className="border p-2 block"
        />

        <input
          placeholder="Status (idle/running)"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 block"
        />

        <button
          onClick={handleUpdate}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Update Bus
        </button>
      </div>
    </div>
  );
}

export default EditBus;