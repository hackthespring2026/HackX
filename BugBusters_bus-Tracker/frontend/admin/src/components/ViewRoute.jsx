import React, { useEffect, useState } from "react";
import { getRoutes } from "../services/adminApi";

const ViewRoute = () => {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    const res = await getRoutes();
    setRoutes(res.data.data);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">All Routes</h2>

      <ul className="space-y-2">
        {routes.map((route) => (
          <li key={route._id} className="border p-2 rounded">
            {route.routeName} — {route.distance} km
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewRoute;