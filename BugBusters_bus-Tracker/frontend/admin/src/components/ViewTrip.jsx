import React, { useEffect, useState } from "react";
import { getActiveTrips, endTrip } from "../services/adminApi";

const ViewTrip = () => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await getActiveTrips();
      setTrips(res.data);
    } catch (err) {
      console.log("Error fetching trips");
    }
  };

  const handleEndTrip = async (id) => {
    try {
      await endTrip(id);
      alert("Trip ended successfully");
      fetchTrips(); // refresh list
    } catch (err) {
      alert("Error ending trip");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Active Trips
        </h2>

        {trips.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-center text-gray-500">
            No active trips
          </div>
        ) : (
          <div className="grid gap-6">
            {trips.map((trip) => (
              <div
                key={trip._id}
                className="bg-white rounded-xl shadow-lg p-6 flex justify-between items-center"
              >
                <div>
                  <h3 className="text-xl font-semibold text-indigo-600">
                    Bus: {trip.busId?.busNumber}
                  </h3>
                  <p className="text-gray-600">
                    Route: {trip.routeId?.routeName}
                  </p>
                  <p className="text-gray-600">
                    Status: {trip.status}
                  </p>

                  {trip.crew && (
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Driver: {trip.crew.driverName || "-"}</p>
                      <p>Conductor: {trip.crew.conductorName || "-"}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleEndTrip(trip._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  End Trip
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewTrip;