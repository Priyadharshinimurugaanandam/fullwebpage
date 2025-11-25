// src/components/QuickStatsCard.tsx ← FINAL 100% ERROR-FREE VERSION
import React from 'react';
import { useData } from '../context/DataContext';
import { BarChart3, Clock, Wrench, Gamepad2 } from 'lucide-react';

const QuickStatsCard: React.FC = () => {
  const { filteredSurgeries, hasData } = useData();

  if (!hasData || filteredSurgeries.length === 0) {
    return (
      <div className="bg-white border-2 border-[#00938e] rounded-lg p-6 shadow-sm min-h-[200px]">
        <h3 className="text-lg font-semibold text-[#00938e] mb-4 text-center uppercase tracking-wide">
          Quick Stats
        </h3>
        <p className="text-sm text-gray-600 text-center">No Relevant data available.</p>
      </div>
    );
  }

  const totalCases = filteredSurgeries.length;

  const averageTime = totalCases > 0
    ? Math.round(
        filteredSurgeries.reduce((sum, surgery) => sum + surgery.duration, 0) / totalCases
      )
    : 0;

  // Count unique instruments — FULLY TYPED
  const totalInstruments = new Set<string>();
  filteredSurgeries.forEach(surgery => {
    if (surgery.instruments_names) {
      surgery.instruments_names
        .split(',')
        .map((name: string) => name.trim())
        .filter((name: string) => name.length > 0)
        .forEach((name: string) => totalInstruments.add(name));
    }
  });

  // Total clutch usage — FULLY TYPED
  const totalClutchUsage = filteredSurgeries.reduce((acc: number, surgery) => {
    if (!surgery.clutch_counts) return acc;
    const counts = surgery.clutch_counts
      .split(',')
      .map((c: string) => parseInt(c.trim(), 10) || 0);
    return acc + counts.reduce((a: number, b: number) => a + b, 0);
  }, 0);

  const stats = [
    { label: 'Total Cases', value: totalCases, icon: BarChart3 },
    { label: 'Avg Time (min)', value: averageTime, icon: Clock },
    { label: 'Instruments', value: totalInstruments.size, icon: Wrench },
    { label: 'Clutch Usage', value: totalClutchUsage, icon: Gamepad2 },
  ];

  return (
    <div className="bg-white border-2 border-[#00938e] rounded-lg p-6 shadow-sm min-h-[200px]">
      <h3 className="text-lg font-semibold text-[#00938e] mb-4 text-center uppercase tracking-wide">
        Quick Stats
      </h3>
      <div className="space-y-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon size={20} className="text-[#00938e]" />
              <span className="text-sm text-gray-700 font-medium">{label}</span>
            </div>
            <span className="text-lg font-bold text-[#00938e]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStatsCard;