export interface ParsedInstrument {
  name: string;
  image?: string | null;
  duration: number;
}

export interface ParsedClutch {
  name: string;
  count: number;
}
export interface Instrument {
  name: string;
  duration: number;
  image?: string;
}
export interface Procedure {
  datetime: Date;
  date: string;
  time: string;
  procedure_name: string;
  surgeon_name: string;
  surgeon_image?: string;
  duration: number;
  instruments: Instrument[];
}
export interface SurgicalData {
  procedure_name: string;
  date: string;
  time: string;
  duration: string | number;
  surgeon_name: string;
  instruments_names?: string;
  instruments_images?: string[];
  instruments_durations?: string;
  clutch_names?: string;
  clutch_counts?: string;
  surgeon_image?: string;
}

export interface ProcessedSurgery extends SurgicalData {
  duration: number;
  instruments: ParsedInstrument[];
  clutches: ParsedClutch[];
  datetime: Date;
}

export interface DashboardData {
  procedure: string;
  surgeon: string;
}