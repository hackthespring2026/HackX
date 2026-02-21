import React, { useEffect, useState } from "react";
import { getBuses } from "../services/adminAPI"

function ViewBus() {
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    const res = await getBuses();
    setBuses(res.data.data);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">View Buses</h2>

      <ul className="space-y-2">
        {buses.map((bus) => (
          <li key={bus._id} className="border p-2 rounded">
            {bus.busNumber} — {bus.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ViewBus;