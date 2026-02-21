import { useContext } from "react";
import { BusContext } from "../context/BusContext";
import CrewDetails from "./CrewDetails";

const BusInfoCard = () => {
  const { bus, error } = useContext(BusContext);

  if (error)
    return (
      <div className="text-center p-6 text-red-400 font-medium bg-[#181C14]/50 rounded-xl border border-red-900/50">
        {error}
      </div>
    );

  if (!bus)
    return (
      <div className="text-center p-10 text-[#697565] italic">
        Search a bus number to see details
      </div>
    );

  return (
    <div className="flex flex-col gap-4 text-[#ECDFCC]">
      
      {/* Bus Header */}
      <div className="flex justify-between items-center bg-[#181C14] p-4 rounded-xl border border-[#697565]">
        <h2 className="text-2xl font-bold text-[#ECDFCC]">
          Bus <span className="text-[#697565]">{bus.busNumber}</span>
        </h2>
        <div className="px-3 py-1 bg-[#3C3D37] border border-[#697565] rounded-full text-xs uppercase tracking-wider">
          {bus.status}
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-[#181C14] rounded-xl border border-[#697565]">
          <p className="text-xs text-[#697565] uppercase">Current Speed</p>
          <p className="text-xl font-mono font-bold text-[#ECDFCC]">
            {bus.speed || 0} <span className="text-sm font-normal">km/h</span>
          </p>
        </div>
        <div className="p-3 bg-[#181C14] rounded-xl border border-[#697565]">
          <p className="text-xs text-[#697565] uppercase">Next Stop</p>
          <p className="text-sm font-bold truncate">{bus.nextStop?.name || "N/A"}</p>
          <p className="text-[10px] text-[#697565]">ETA: {bus.nextStop?.eta || "--"}</p>
        </div>
      </div>

      {/* Personnel Details */}
      <div className="space-y-3">
        {/* Driver Card */}
        <div className="p-4 bg-[#3C3D37] rounded-xl border border-[#697565] hover:border-[#ECDFCC] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#697565] flex items-center justify-center text-[#181C14] font-bold">
              D
            </div>
            <div>
              <p className="text-[10px] uppercase text-[#697565]">Driver</p>
              <p className="font-semibold">{bus.crew.driverName}</p>
              <p className="text-xs text-[#697565]">{bus.crew.driverPhone}</p>
            </div>
          </div>
        </div>

        {/* Conductor Card */}
        <div className="p-4 bg-[#3C3D37] rounded-xl border border-[#697565] hover:border-[#ECDFCC] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#697565] flex items-center justify-center text-[#181C14] font-bold">
              C
            </div>
            <div>
              <p className="text-[10px] uppercase text-[#697565]">Conductor</p>
              <p className="font-semibold">{bus.crew.conductorName}</p>
              <p className="text-xs text-[#697565]">{bus.crew.conductorPhone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Crew Component */}
      <div className="border-t border-[#697565] pt-4 mt-2">
        <CrewDetails />
      </div>

    </div>
  );
};

export default BusInfoCard;