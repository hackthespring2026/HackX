import { useContext } from "react";
import { BusContext } from "../context/BusContext";

const CrewDetails = () => {
  const { bus } = useContext(BusContext);

  if (!bus?.crew?.length) return null;

  return (
    <div>
      <h3>Crew Members</h3>
      {bus.crew.map((member, index) => (
        <div key={index}>
          {member.name} - {member.role}
        </div>
      ))}
    </div>
  );
};

export default CrewDetails;