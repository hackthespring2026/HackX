import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, AlertCircle, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusConfig = {
  PENDING: { color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle, label: "Pending" },
  IN_PROGRESS: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: PlayCircle, label: "In Progress" },
  RESOLVED_BY_AUTHORITY: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Resolved" },
  CLOSED: { color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2, label: "Closed" },
  REOPENED: { color: "bg-red-50 text-red-700 border-red-200", icon: Clock, label: "Reopened" },
};

const AdminComplaintsTable = ({ complaints = [] }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(complaints.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentComplaints = complaints.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="bg-slate-50 p-4 rounded-full">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No complaints found</h3>
        <p className="text-slate-500 mt-1">There are no complaints to display at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Recent Complaints</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage citizen reports</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentComplaints.map((item) => {
              const status = statusConfig[item.status] || { color: "bg-gray-100 text-gray-600", icon: AlertCircle, label: item.status };
              const StatusIcon = status.icon;

              return (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/admin/complaint/${item.id}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={item.image || "https://placehold.co/100x100?text=No+Img"}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/100x100?text=No+Img";
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1 max-w-[200px]">{item.title}</p>
                        <p className="text-xs text-slate-500">ID: #{item.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 font-medium">
                      {item.category?.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500">
                      {new Date(item.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <p className="text-slate-400">
                      {item.street}, {item.area}, {item.city}, {item.state}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, complaints.length)} of {complaints.length}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-700 px-2">
            Page {currentPage}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminComplaintsTable;
