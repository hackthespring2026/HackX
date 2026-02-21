import { Polyline } from "react-leaflet";
import { useContext } from "react";
import { BusContext } from "../context/BusContext";

const RoutePolyline = () => {
  const { bus } = useContext(BusContext);

  if (!bus?.route) return null;

  const positions = bus.route.map((stop) => [
    stop.lat,
    stop.lng
  ]);

  return (
    <Polyline
      positions={positions}
      color="blue"
      weight={5}
    />
  );
};

export default RoutePolyline;