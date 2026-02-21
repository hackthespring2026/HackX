import React, { useState, useEffect } from 'react';
import { Download, Filter, RefreshCcw } from 'lucide-react';
import AdminStatsCards from '../../features/dashboard/components/AdminStatsCards';
import AdminCharts from '../../features/dashboard/components/AdminCharts';
import AdminComplaintsTable from '../../features/complaints/components/AdminComplaintsTable';
import axios from 'axios';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      const response = await axios.get(
        "http://127.0.0.1:8000/api/complaints/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComplaints(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of city-wide civic reports and metrics</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
          <span className="text-xs text-slate-400 font-medium hidden sm:block">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchComplaints}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <AdminStatsCards complaints={complaints} />
          <AdminCharts complaints={complaints} />
          <AdminComplaintsTable complaints={complaints} />
        </>
      )}

    </div>
  );
};

export default AdminDashboard;