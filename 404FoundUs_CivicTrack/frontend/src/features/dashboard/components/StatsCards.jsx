import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import API from '../../../services/api';

const StatsCards = () => {

  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem("access");

        const response = await API.get(
          "/api/complaints/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setComplaints(response.data);
      } catch (error) {
        console.error("Error fetching complaints:", error.response?.data);
      }
    };

    fetchComplaints();
  }, []);


  const total = complaints.length;
  const normalize = (status) =>
    status?.toLowerCase().replace(" ", "_");

  const pending = complaints.filter(c => normalize(c.status) === "reopened").length;
  const inProgress = complaints.filter(c => normalize(c.status) === "in_progress").length;
  const resolved = complaints.filter(c => normalize(c.status) === "closed").length;

  const stats = [
    { label: 'Total Complaints', value: total, icon: AlertCircle, iconColor: 'text-white', iconBg: 'bg-blue-500' },
    { label: 'In Progress', value: inProgress, icon: TrendingUp, iconColor: 'text-white', iconBg: 'bg-indigo-500' },
    { label: 'Closed', value: resolved, icon: CheckCircle2, iconColor: 'text-white', iconBg: 'bg-green-500' },
    { label: 'Re-Opened', value: pending, icon: Clock, iconColor: 'text-white', iconBg: 'bg-orange-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-2">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-full ${stat.iconBg} shadow-lg`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
