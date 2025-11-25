// src/components/Sidebar.tsx ← REPLACE ENTIRE FILE
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import CSVUpload from './CSVUpload';
import ExportReport from './ExportReport';
import QuickStatsCard from './QuickStatsCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { 
    filters, 
    setFilters, 
    uniqueProcedures, 
    uniqueSurgeons, 
    filteredSurgeries, 
    hasData 
  } = useData();

  const [procedureExpanded, setProcedureExpanded] = useState(false);
  const [surgeonExpanded, setSurgeonExpanded] = useState(false);

  const handleProcedureSelect = (procedure: string) => {
    setFilters({ 
      ...filters, 
      procedure: filters.procedure === procedure ? '' : procedure 
    });
    setProcedureExpanded(false);
  };

  const handleSurgeonSelect = (surgeon: string) => {
    setFilters({ 
      ...filters, 
      surgeon: filters.surgeon === surgeon ? '' : surgeon 
    });
    setSurgeonExpanded(false);
  };

  return (
    <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-[#d2e2eb] shadow-2xl p-6 overflow-y-auto z-40">
      <div className="space-y-6">

        {/* CSV UPLOAD */}
        <CSVUpload />

        {hasData && (
          <>
            {/* EXPORT REPORT */}
            <ExportReport />

            {/* PROCEDURE FILTER */}
            <div className="bg-white border-2 border-[#00938e] rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => setProcedureExpanded(!procedureExpanded)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-teal-50 transition-all"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#00938e] uppercase tracking-wider">
                    Procedure
                  </h3>
                  {filters.procedure && (
                    <p className="text-xs text-gray-700 mt-1 font-medium">{filters.procedure}</p>
                  )}
                </div>
                {procedureExpanded ? (
                  <ChevronUp className="text-[#00938e]" size={22} />
                ) : (
                  <ChevronDown className="text-[#00938e]" size={22} />
                )}
              </button>

              {procedureExpanded && (
                <div className="border-t-2 border-[#00938e] max-h-64 overflow-y-auto bg-gray-50">
                  <div
                    onClick={() => handleProcedureSelect('')}
                    className={`p-4 cursor-pointer font-semibold transition-all ${
                      !filters.procedure ? 'bg-[#00938e] text-white' : 'hover:bg-gray-200'
                    }`}
                  >
                  All procedure
                  </div>
                  {uniqueProcedures.map((proc) => (
                    <div
                      key={proc}
                      onClick={() => handleProcedureSelect(proc)}
                      className={`p-4 cursor-pointer transition-all border-b border-gray-200 last:border-0 ${
                        filters.procedure === proc 
                          ? 'bg-[#00938e] text-white font-semibold' 
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      {proc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SURGEON FILTER */}
            <div className="bg-white border-2 border-[#00938e] rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => setSurgeonExpanded(!surgeonExpanded)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-teal-50 transition-all"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#00938e] uppercase tracking-wider">
                    Surgeon
                  </h3>
                  {filters.surgeon && (
                    <p className="text-xs text-gray-700 mt-1 font-medium">{filters.surgeon}</p>
                  )}
                </div>
                {surgeonExpanded ? (
                  <ChevronUp className="text-[#00938e]" size={22} />
                ) : (
                  <ChevronDown className="text-[#00938e]" size={22} />
                )}
              </button>

              {surgeonExpanded && (
                <div className="border-t-2 border-[#00938e] max-h-64 overflow-y-auto bg-gray-50">
                  <div
                    onClick={() => handleSurgeonSelect('')}
                    className={`p-4 cursor-pointer font-semibold transition-all ${
                      !filters.surgeon ? 'bg-[#00938e] text-white' : 'hover:bg-gray-200'
                    }`}
                  >
                    All Surgeons
                  </div>
                  {uniqueSurgeons.map((surgeon) => (
                    <div
                      key={surgeon}
                      onClick={() => handleSurgeonSelect(surgeon)}
                      className={`p-4 cursor-pointer transition-all border-b border-gray-200 last:border-0 ${
                        filters.surgeon === surgeon 
                          ? 'bg-[#00938e] text-white font-semibold' 
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      {surgeon}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK STATS */}
            <QuickStatsCard />
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;