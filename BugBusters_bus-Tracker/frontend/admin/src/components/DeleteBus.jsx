import React, { useState } from "react";
import axios from "axios";

function DeleteBus() {
  const [id, setId] = useState("");

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/bus/${id}`);
      alert("Bus Deleted");
      setId("");
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Delete Bus</h2>

      <input
        placeholder="Bus ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="border p-2"
      />

      <button
        onClick={handleDelete}
        className="ml-3 bg-red-500 text-white px-4 py-2 rounded"
      >
        Delete
      </button>
    </div>
  );
}

export default DeleteBus;