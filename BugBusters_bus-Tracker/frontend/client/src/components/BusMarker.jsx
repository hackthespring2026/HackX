import { Marker, Popup } from "react-leaflet";
import { useContext } from "react";
import { BusContext } from "../context/BusContext";

const BusMarker = () => {
  const { bus } = useContext(BusContext);

  if (!bus?.currentLocation) return null;

  return (
    <Marker
      position={[
        bus.currentLocation.lat,
        bus.currentLocation.lng
      ]}
    >
      <Popup>
        <b>Bus {bus.busNumber}</b><br />
        Speed: {bus.speed || 0} km/h
      </Popup>
    </Marker>
  );
};

export default BusMarker;