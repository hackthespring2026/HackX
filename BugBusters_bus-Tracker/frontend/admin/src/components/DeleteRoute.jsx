import React, { useState } from "react";
import { deleteRoute } from "../services/adminApi";

const DeleteRoute = () => {
  const [id, setId] = useState("");

  const handleDelete = async () => {
    try {
      await deleteRoute(id);
      alert("Route deleted");
      setId("");
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Delete Route</h2>

      <input
        placeholder="Route ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="border p-2"
      />

      <button
        onClick={handleDelete}
        className="ml-3 bg-red-600 text-white px-4 py-2 rounded"
      >
        Delete
      </button>
    </div>
  );
};

export default DeleteRoute;