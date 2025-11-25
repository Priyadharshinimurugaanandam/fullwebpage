// src/context/DataContext.tsx ← FINAL PERFECT VERSION (SURGEON + SUPPORT)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { processSurgicalData } from '../utils/processData';

interface Filters {
  procedure: string;
  surgeon: string;
}

interface DataContextType {
  surgeries: any[];
  filteredSurgeries: any[];
  filters: Filters;
  setFilters: (f: Filters | ((prev: Filters) => Filters)) => void;
  setSurgeries: (s: any[]) => void;
  uniqueProcedures: string[];
  uniqueSurgeons: string[];
  hasData: boolean;
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [filters, setFilters] = useState<Filters>({ procedure: '', surgeon: '' });
  const [isLoading, setIsLoading] = useState(true);

  // GET CURRENT USER
  const userJson = localStorage.getItem('current_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const isSupport = user?.isSupport === true;
  const surgeonName = user?.username || user?.name || '';

  // AUTO-SET SURGEON FILTER WHEN SURGEON LOGS IN
  useEffect(() => {
    if (user && !isSupport && surgeonName) {
      setFilters(prev => ({
        ...prev,
        surgeon: surgeonName // FORCE surgeon filter
      }));
    } else if (isSupport) {
      setFilters(prev => ({ ...prev, surgeon: '' })); // Support sees all
    }
  }, []); // Run once on mount

  // FETCH DATA FROM SUPABASE
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('surgeries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
      } else {
        const processed = processSurgicalData(data || []);
        setSurgeries(processed);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // FILTER DATA — PERFECT LOGIC
  const filteredSurgeries = surgeries.filter(s => {
    // Procedure filter
    const matchProcedure = !filters.procedure || s.procedure_name === filters.procedure;

    // Access control: Support sees all, Surgeon sees only their own
    const hasAccess = isSupport || s.surgeon_name === surgeonName;

    // For surgeons: ignore manual surgeon filter (it's auto-set)
    // For support: allow manual surgeon filter
    const matchSurgeon = isSupport
      ? (!filters.surgeon || s.surgeon_name === filters.surgeon)
      : true; // Surgeon always sees only their data

    return matchProcedure && hasAccess && matchSurgeon;
  });

  // Unique values (for filters)
  const uniqueProcedures = [...new Set(surgeries.map(s => s.procedure_name))].sort();
  const uniqueSurgeons = isSupport
    ? [...new Set(surgeries.map(s => s.surgeon_name))].sort()
    : [surgeonName]; // Surgeon only sees their name in filter (if needed)

  return (
    <DataContext.Provider value={{
      surgeries,
      filteredSurgeries,
      filters,
      setFilters,
      setSurgeries,
      uniqueProcedures,
      uniqueSurgeons,
      hasData: surgeries.length > 0,
      isLoading,
      setIsLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};