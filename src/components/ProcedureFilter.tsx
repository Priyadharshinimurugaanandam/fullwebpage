// Example: src/components/ProcedureFilter.tsx or wherever your filter is
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ProcedureFilterProps {
  selectedProcedure: string;
  onProcedureChange: (procedure: string) => void;
  surgeonName: string; // ← Pass the logged-in surgeon's name
}

const ProcedureFilter: React.FC<ProcedureFilterProps> = ({
  selectedProcedure,
  onProcedureChange,
  surgeonName
}) => {
  const [procedures, setProcedures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProceduresForSurgeon = async () => {
      if (!surgeonName) {
        setProcedures([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('surgeries')
        .select('procedure_name')
        .eq('surgeon_name', surgeonName)
        .not('procedure_name', 'is', null);

      if (error) {
        console.error('Error fetching procedures:', error);
        setProcedures([]);
      } else {
        const uniqueProcedures = [...new Set(
          data
            .map(row => row.procedure_name?.trim())
            .filter(Boolean)
        )].sort();

        setProcedures(uniqueProcedures);
      }
      setLoading(false);
    };

    fetchProceduresForSurgeon();
  }, [surgeonName]);

  if (loading) {
    return <div className="text-gray-500">Loading procedures...</div>;
  }

  if (procedures.length === 0) {
    return <div className="text-gray-500">No procedures found for {surgeonName}</div>;
  }


};

export default ProcedureFilter;