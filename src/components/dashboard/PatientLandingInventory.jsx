import React from "react";
import MedicineList from "../medicine/MedicineList";

export default function PatientLandingInventory() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900">Medicine Availability by Barangay</h3>
        <p className="text-sm text-gray-600 mt-1">
          Use filters below to quickly decide where to go before traveling.
        </p>
        <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
          Currently viewing: All Barangays
        </div>
      </div>

      <MedicineList isPatientView={true} />
    </div>
  );
}
