import React from 'react';
import StatsCards from '../../features/dashboard/components/StatsCards';
import ComplaintsTable from '../../features/dashboard/components/ComplaintsTable';

const Dashboard = () => {
  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-2 text-lg">Welcome back! Here's an overview of your civic complaints.</p>
      </div>

      <StatsCards />

      <ComplaintsTable />

    </div>
  );
};

export default Dashboard;