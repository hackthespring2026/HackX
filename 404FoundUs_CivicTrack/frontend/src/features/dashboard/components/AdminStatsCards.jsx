import React from "react";
import { FileText, Clock, Activity, CheckCircle } from "lucide-react";

const AdminStatsCards = ({ complaints = [] }) => {

  const stats = [
    {
      label: "Total Complaints",
      value: complaints.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100"
    },
    {
      label: "Pending",
      value: complaints.filter(c => c.status === "PENDING").length,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100"
    },
    {
      label: "In Progress",
      value: complaints.filter(c => c.status === "IN_PROGRESS").length,
      icon: Activity,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100"
    },
    {
      label: "Resolved",
      value: complaints.filter(c => ["RESOLVED_BY_AUTHORITY", "CLOSED"].includes(c.status)).length,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {stat.label}
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              {stat.value}
            </h2>
          </div>
          <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
            <stat.icon size={24} strokeWidth={2} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStatsCards;
