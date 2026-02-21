import React, { useMemo } from "react";
import {
   BarChart,
   Bar,
   XAxis,
   YAxis,
   Tooltip,
   ResponsiveContainer,
   LineChart,
   Line,
   PieChart,
   Pie,
   Cell,
   Legend,
   CartesianGrid,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f97316", "#ef4444", "#8b5cf6"];

const AdminCharts = ({ complaints = [] }) => {

   const totalComplaints = complaints.length;

   const statusData = useMemo(() => {
      const counts = complaints.reduce((acc, item) => {
         const status = item.status || "Unknown";
         acc[status] = (acc[status] || 0) + 1;
         return acc;
      }, {});

      return Object.entries(counts)
         .map(([status, count]) => ({ status: status.replace(/_/g, " "), count }))
         .sort((a, b) => b.count - a.count);
   }, [complaints]);

   const dailyTrend = useMemo(() => {
      const today = new Date();
      const days = [];

      for (let i = 6; i >= 0; i--) {
         const d = new Date(today);
         d.setDate(today.getDate() - i);
         const formatted = d.toISOString().split("T")[0];
         days.push(formatted);
      }

      const counts = {};

      complaints.forEach((item) => {
         const date = item.created_at?.split("T")[0];
         if (days.includes(date)) {
            counts[date] = (counts[date] || 0) + 1;
         }
      });

      return days.map((date) => ({
         date: date.slice(5), 
         count: counts[date] || 0,
      }));
   }, [complaints]);

   const categoryData = useMemo(() => {
      const counts = complaints.reduce((acc, item) => {
         const category = item.category?.replace(/_/g, " ") || "Uncategorized";
         acc[category] = (acc[category] || 0) + 1;
         return acc;
      }, {});

      return Object.entries(counts)
         .map(([name, count]) => ({
            name,
            count,
            percentage: ((count / totalComplaints) * 100).toFixed(1),
         }))
         .sort((a, b) => b.count - a.count);
   }, [complaints, totalComplaints]);


   if (!complaints.length) {
      return (
         <div className="p-10 text-center text-slate-400 font-semibold bg-white rounded-xl border border-dashed border-slate-200">
            No data available for analytics yet.
         </div>
      );
   }

   return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-6">
               Status Distribution
            </h3>

            <ResponsiveContainer width="100%" height={260}>
               <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                     dataKey="status"
                     tick={{ fontSize: 10, fill: "#64748b" }}
                     axisLine={false}
                     tickLine={false}
                     interval={0}
                  />
                  <YAxis
                     tick={{ fontSize: 10, fill: "#64748b" }}
                     axisLine={false}
                     tickLine={false}
                  />
                  <Tooltip
                     cursor={{ fill: "#f8fafc" }}
                     contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar
                     dataKey="count"
                     fill="#6366f1"
                     radius={[4, 4, 0, 0]}
                     barSize={40}
                  />
               </BarChart>
            </ResponsiveContainer>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-6">
               Complaints (Last 7 Days)
            </h3>

            <ResponsiveContainer width="100%" height={260}>
               <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                     dataKey="date"
                     tick={{ fontSize: 10, fill: "#64748b" }}
                     axisLine={false}
                     tickLine={false}
                  />
                  <YAxis
                     tick={{ fontSize: 10, fill: "#64748b" }}
                     axisLine={false}
                     tickLine={false}
                  />
                  <Tooltip
                     contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Line
                     type="monotone"
                     dataKey="count"
                     stroke="#10b981"
                     strokeWidth={3}
                     dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                     activeDot={{ r: 6 }}
                  />
               </LineChart>
            </ResponsiveContainer>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-6">
               Category Breakdown
            </h3>

            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={categoryData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        label={({ name, percentage }) =>
                           `${percentage}%`
                        }
                        labelLine={false}
                     >
                        {categoryData.map((entry, index) => (
                           <Cell
                              key={index}
                              fill={COLORS[index % COLORS.length]}
                              strokeWidth={0}
                           />
                        ))}
                     </Pie>
                     <Tooltip
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                     />
                     <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px", color: "#64748b" }}
                     />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

      </div>
   );

};

export default AdminCharts;
