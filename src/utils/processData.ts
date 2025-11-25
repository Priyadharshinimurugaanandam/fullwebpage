// src/utils/processData.ts
import { SurgicalData } from '../types';

export const processSurgicalData = (data: SurgicalData[]) => {
  return data.map(item => ({
    ...item,
    datetime: new Date(`${item.date} ${item.time}`),
    duration: Number(item.duration) || 0,
    instruments: (item.instruments_names || '')
      .split(',').map((n: string) => n.trim())
      .filter(Boolean)
      .map((name: string, i: number) => ({
        name,
        duration: Number((item.instruments_durations || '').split(',')[i] || 0)
      })),
    clutches: (item.clutch_names || '')
      .split(',').map((n: string) => n.trim())
      .filter(Boolean)
      .map((name: string, i: number) => ({
        name,
        count: Number((item.clutch_counts || '').split(',')[i] || 0)
      }))
  }));
};