import React from "react";

// Reusable stats card with icon, title, value
function StatsCard({ icon: Icon, title, value, subtitle, color = "#3b82f6", className = "" }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">{title}</p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
        >
          {Icon && <Icon style={{ color }} className="text-lg" />}
        </div>
      </div>
      <p className="text-white font-display font-bold text-2xl mb-1">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
    </div>
  );
}

export default StatsCard;
