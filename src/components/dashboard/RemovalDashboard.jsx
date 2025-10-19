import { useState } from "react";
import StockRemovalHistory from "../medicine/StockRemovalHistory";
import RemovalStatsDashboard from "./RemovalStatsDashboard";

const RemovalsDashboard = () => {
  const [activeTab, setActiveTab] = useState("history");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium ${
            activeTab === "history"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 font-medium ${
            activeTab === "stats"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Stats
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "history" && <StockRemovalHistory />}
        {activeTab === "stats" && <RemovalStatsDashboard />}
      </div>
    </div>
  );
};

export default RemovalsDashboard;
