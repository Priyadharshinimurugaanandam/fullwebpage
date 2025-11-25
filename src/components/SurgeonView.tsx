// src/components/SurgeonView.tsx ← YOUR EXACT UI + FULLY TYPE-SAFE
import React from 'react';
import { useData } from '../context/DataContext';
import ProgressBar from '../components/ProgressBar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from '../components/Image';

interface Clutch {
  name: string;
  count: number;
}

interface Instrument {
  name: string;
  duration: number;
}

interface Surgery {
  datetime: Date | string;
  duration: number;
  procedure_name: string;
  date: string;
  time: string;
  clutches: Clutch[];
  instruments: Instrument[];
  surgeon_name?: string;
}

const SurgeonView: React.FC = () => {
  const { filteredSurgeries, filters, surgeries, hasData } = useData();

  if (!hasData || filteredSurgeries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No data available for {filters.surgeon || 'any surgeon'}.</p>
      </div>
    );
  }

  // Type assertion for safety
  const typedSurgeries = filteredSurgeries as Surgery[];

  const lastSurgery = [...typedSurgeries].sort((a, b) => 
    new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  )[0];

  const totalCases = typedSurgeries.length;
  const averageTime = Math.round(
    typedSurgeries.reduce((sum, surgery) => sum + surgery.duration, 0) / totalCases
  );

  const clutchStats = typedSurgeries.reduce((acc, surgery) => {
    surgery.clutches.forEach((clutch: Clutch) => {
      if (!acc[clutch.name]) {
        acc[clutch.name] = { totalCount: 0, surgeryCount: 0 };
      }
      acc[clutch.name].totalCount += clutch.count;
      acc[clutch.name].surgeryCount += 1;
    });
    return acc;
  }, {} as Record<string, { totalCount: number; surgeryCount: number }>);

  const clutchAverages = Object.entries(clutchStats).map(([name, stats]) => ({
    name,
    totalCount: stats.totalCount,
    averagePerSurgery: Math.round(stats.totalCount / stats.surgeryCount)
  }));

  const totalClutchUsage = clutchAverages.reduce((sum, clutch) => sum + clutch.totalCount, 0);

  const bestSurgery = typedSurgeries.reduce((min, surgery) => 
    surgery.duration < min.duration ? surgery : min,
    typedSurgeries[0]
  );

  const instrumentStats = typedSurgeries.reduce((acc, surgery) => {
    surgery.instruments.forEach((instrument: Instrument) => {
      if (!acc[instrument.name]) {
        acc[instrument.name] = 0;
      }
      acc[instrument.name] += instrument.duration;
    });
    return acc;
  }, {} as Record<string, number>);

  const mostUsedInstrument = Object.entries(instrumentStats).reduce(
    (max, [name, duration]) => 
      duration > max.duration ? { name, duration } : max,
    { name: 'None', duration: 0 }
  );

  const surgeryTimelineData = [...typedSurgeries]
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    .map(surgery => ({
      date: surgery.date,
      duration: surgery.duration,
      procedure: surgery.procedure_name
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      <div className="lg:col-span-3">
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#00938e] rounded-lg p-6 shadow-sm min-h-[280px]">
            <div className="mb-6 text-center">
              <Image
                type="surgeon"
                name={filters.surgeon || ''}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-[#00938e]">{filters.surgeon || 'All Surgeons'}</h3>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-xs text-[#00938e] uppercase tracking-wide font-semibold">Total Cases</p>
                <p className="text-3xl font-bold text-[#00938e]">{totalCases}</p>
              </div>
              <div>
                <p className="text-xs text-[#00938e] uppercase tracking-wide font-semibold">Average Time</p>
                <p className="text-3xl font-bold text-[#00938e]">{averageTime} min</p>
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-[#00938e] rounded-lg p-4 shadow-sm min-h-[100px]">
            <h4 className="text-sm font-semibold text-[#00938e] uppercase tracking-wide mb-2">Most Used Instrument</h4>
            <p className="text-lg font-bold text-[#00938e]">{mostUsedInstrument.name}</p>
            <p className="text-xs text-gray-600">{mostUsedInstrument.duration} min total</p>
          </div>
          <div className="bg-white border-2 border-[#00938e] rounded-lg p-6 shadow-sm min-h-[200px]">
            <h4 className="text-sm font-semibold text-[#00938e] uppercase tracking-wide mb-4">Surgery Duration Timeline</h4>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={surgeryTimelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip 
                  formatter={(value: any) => [`${value} min`, 'Duration']}
                  labelFormatter={(label: any) => `Date: ${label}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-gray-300 rounded shadow">
                          <p>Date: {label}</p>
                          <p>Duration: {data.duration} min</p>
                          <p>Procedure: {data.procedure}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="duration" stroke="#00938e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#00938e] rounded-lg p-6 shadow-sm min-h-[280px]">
            <h3 className="text-lg font-semibold text-[#00938e] mb-4 uppercase tracking-wide">Last Surgery</h3>
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="font-bold text-lg text-[#00938e]">{lastSurgery.procedure_name}</p>
                  <p className="font-bold text-2xl text-[#00938e]">{lastSurgery.duration} min</p>
                  <p className="text-xs text-gray-500">
                    {lastSurgery.date} at {lastSurgery.time}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[#00938e] uppercase tracking-wide">
                Instruments Used
              </h4>
              {lastSurgery.instruments.length > 0 ? (
                lastSurgery.instruments.slice(0, 10).map((instrument: Instrument, index: number) => {
                  const percentage = Math.round((instrument.duration / lastSurgery.duration) * 100);
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <Image
                        type="instrument"
                        name={instrument.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">{instrument.name}</p>
                        <ProgressBar
                          percentage={percentage}
                          duration={instrument.duration}
                          size="sm"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-600">No instruments used.</p>
              )}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-[#00938e] uppercase tracking-wide mb-2">
                  Clutch Usage
                </h4>
                {lastSurgery.clutches.length > 0 ? (
                  lastSurgery.clutches.map((clutch: Clutch, index: number) => (
                    <div key={index} className="flex justify-between items-center mb-1">
                      <p className="text-xs font-medium">{clutch.name}</p>
                      <span className="text-xs text-[#00938e] font-semibold">{clutch.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No clutches used.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#00938e] rounded-lg p-6 shadow-sm min-h-[400px]">
            <h3 className="text-lg font-semibold text-[#00938e] mb-4 uppercase tracking-wide">Total Clutch Usage</h3>
            <div className="mb-6">
              <p className="text-xs text-[#00938e] uppercase tracking-wide font-semibold">Total Count</p>
              <p className="text-3xl font-bold text-[#00938e]">{totalClutchUsage}</p>
            </div>
            <div className="space-y-4">
              {clutchAverages.length > 0 ? (
                clutchAverages.map((clutch, index) => (
                  <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">{clutch.name}</p>
                      <span className="text-xs text-gray-600">
                        {clutch.totalCount} total
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#00938e]">
                      {clutch.totalCount}/{clutch.averagePerSurgery} (Total/Average)
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No clutches used.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="bg-white border-2 border-[#00938e] rounded-lg p-6 shadow-sm min-h-[400px]">
          <div>
            <h4 className="text-sm font-semibold text-[#00938e] uppercase tracking-wide mb-4">Best Surgery</h4>
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="font-bold text-sm text-[#00938e]">{bestSurgery.procedure_name}</p>
                  <p className="font-bold text-xl text-[#00938e]">{bestSurgery.duration} min</p>
                  <p className="text-xs text-gray-500">
                    {bestSurgery.date} at {bestSurgery.time}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-[#00938e] uppercase tracking-wide">
                Top Instruments
              </h5>
              {bestSurgery.instruments.length > 0 ? (
                bestSurgery.instruments.slice(0, 10).map((instrument: Instrument, index: number) => {
                  const percentage = Math.round((instrument.duration / bestSurgery.duration) * 100);
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <Image
                        type="instrument"
                        name={instrument.name}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-medium">{instrument.name}</p>
                          <span className="text-xs text-gray-600">{percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-600">No instruments used.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurgeonView;