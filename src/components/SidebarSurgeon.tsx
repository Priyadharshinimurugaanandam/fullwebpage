// src/components/SidebarSurgeon.tsx
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import ExportReport from './ExportReport';
import QuickStatsCard from './QuickStatsCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

const SidebarSurgeon: React.FC = () => {
  const { filters, setFilters, hasData, surgeries } = useData();
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');

  const [procedureExpanded, setProcedureExpanded] = useState(false);

  // Build procedure list from ALL surgeries of the surgeon, NOT filteredSurgeries
  const surgeonProcedures = useMemo(() => {
    if (!user?.username || !surgeries) return [];

    return [...new Set(
      surgeries
        .filter(s => s.surgeon_name === user.username)
        .map(s => s.procedure_name?.trim())
        .filter(Boolean)
    )].sort();
  }, [user.username, surgeries]);

  // Do NOT close after selecting
  const handleProcedureSelect = (procedure: string) => {
    setFilters({
      ...filters,
      procedure: filters.procedure === procedure ? '' : procedure
    });
  };

  return (
    <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-[#d2e2eb] shadow-2xl p-6 overflow-y-auto z-40">
      <div className="space-y-6">

        {hasData && <ExportReport />}

        {hasData && (
          <>
            {/* COLLAPSIBLE PROCEDURE FILTER (MATCHES MAIN SIDEBAR EXACTLY) */}
            <div className="bg-white border-2 border-[#00938e] rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => setProcedureExpanded(!procedureExpanded)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-teal-50 transition-all"
              >
                <div>
                  <h3 className="text-sm font-bold text-[#00938e] uppercase tracking-wider">
                    Procedure
                  </h3>
                  {filters.procedure ? (
                    <p className="text-xs text-gray-700 mt-1 font-medium">{filters.procedure}</p>
                  ) : (
                    <p className="text-xs text-gray-500 italic mt-1"></p>
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

                  {/* ALL MY CASES option */}
                  <div
                    onClick={() => handleProcedureSelect('')}
                    className={`p-4 cursor-pointer font-semibold transition-all ${
                      !filters.procedure ? 'bg-[#00938e] text-white' : 'hover:bg-gray-200'
                    }`}
                  >
                    All My Cases
                  </div>

                  {/* LIST OF ALL SURGEON PROCEDURES */}
                  {surgeonProcedures.map((proc) => (
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

            {/* QUICK STATS */}
            <QuickStatsCard />
          </>
        )}

        {!hasData && (
          <div className="text-center py-16 bg-white/80 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-600 font-medium">No surgical data yet</p>
            <p className="text-xs text-gray-500 mt-2">Your cases will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarSurgeon;
