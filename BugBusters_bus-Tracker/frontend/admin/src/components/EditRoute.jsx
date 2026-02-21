import React, { useState } from "react";
import { updateRoute } from "../services/adminApi";

const EditRoute = () => {
  const [id, setId] = useState("");
  const [routeName, setRouteName] = useState("");

  const handleUpdate = async () => {
    try {
      await updateRoute(id, { routeName });
      alert("Route updated");
    } catch {
      alert("Update failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Edit Route</h2>

      <input
        placeholder="Route ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="border p-2 block mb-3"
      />

      <input
        placeholder="New Route Name"
        value={routeName}
        onChange={(e) => setRouteName(e.target.value)}
        className="border p-2 block mb-3"
      />

      <button
        onClick={handleUpdate}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Update
      </button>
    </div>
  );
};

export default EditRoute;