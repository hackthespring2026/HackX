import React, { useState, useEffect } from 'react';
import { Eye, MoreHorizontal, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../../services/api';

const ComplaintsTable = () => {
  const navigate = useNavigate();


  const [allComplaints, setAllComplaints] = useState([]);

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

        setAllComplaints(response.data);

      } catch (error) {
        console.error("Error fetching complaints:", error.response?.data);
      }
    };

    fetchComplaints();
  }, []);



  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

      <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recent Complaints</h2>
          <p className="text-gray-500 text-sm mt-1">Latest civic issues reported by citizens</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/report')}
          className="hover:cursor-pointer  px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-sm"
        >
          Report New Issue
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allComplaints.map((item) => (
              <tr
                key={item.id}
                onClick={() => navigate(`/dashboard/complaint/${item.id}`)} // 3. CLICK HANDLER ADDED HERE
                className="hover:bg-gray-50/80 transition-colors group cursor-pointer" // cursor-pointer ensures the hand icon appears
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        item.image?.startsWith("http")
                          ? item.image
                          : `http://127.0.0.1:8000${item.image}`
                      }
                      alt={item.title}
                      className="w-12 h-12 rounded-xl object-cover shadow-sm"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/48";
                      }}
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">by {item.user}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm text-gray-600 font-medium">{item.category.replace("_", " ").toUpperCase()}</td>
                <td className="px-8 py-6 text-sm text-gray-500 max-w-[200px]">{item.street}, {item.area}, {item.city}, {item.state}</td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                      item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                    {item.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm text-gray-500 whitespace-nowrap">
                  {new Date(item.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComplaintsTable;