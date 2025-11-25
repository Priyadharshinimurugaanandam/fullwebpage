import React from 'react';
import { useData } from '../context/DataContext';
import DefaultView from './DefaultView';
import CombinedView from './CombinedView';
import ProcedureView from './ProcedureView';
import SurgeonView from './SurgeonView';

const Dashboard: React.FC<{ user: any }> = ({ user }) => {
  const { filters } = useData();

  if (!user.isSupport && user.username !== filters.surgeon) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-3xl font-bold text-[#00938e] mb-4">
          Welcome, {user.username}
        </h2>
        <p className="text-xl text-gray-700">You can only view your own surgeries.</p>
      </div>
    );
  }

  const hasProcedure = !!filters.procedure;
  const hasSurgeon = !!filters.surgeon;

  if (hasProcedure && hasSurgeon) {
    return <CombinedView />;
  } else if (hasProcedure) {
    return <ProcedureView />;
  } else if (hasSurgeon) {
    return <SurgeonView />;
  } else {
    return <DefaultView />;
  }
};

export default Dashboard;