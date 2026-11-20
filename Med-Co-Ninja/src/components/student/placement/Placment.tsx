import { useState } from "react";
import Openings from "./Openenings";
import Questions from "./Quetions";
import Interview from "../Interview";

const Placement = () => {
  const [activeTab, setActiveTab] = useState("openings");

  return (
    <div className="mt-5">
      <h2 className="mb-2 text-lg font-bold text-gray-800 sm:text-xl">Placement</h2>
      <hr className="mb-3 opacity-25" />
      <div >
        {activeTab === "openings" && <Openings />}

      </div>
    </div>
  );
};

export default Placement;