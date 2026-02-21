import React, { useState, useEffect } from "react";
import {
   ArrowLeft,
   Calendar,
   MapPin,
   User,
   Clock,
   CheckCircle2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import API from "../../../services/api";

const ComplaintDetailView = () => {
   const { id } = useParams();
   const [complaint, setComplaint] = useState(null);
   const [isEditing, setIsEditing] = useState(false);
   const [editedData, setEditedData] = useState({});
   const [errorMessage, setErrorMessage] = useState("");

   const handleSave = async () => {
      try {
         const token = localStorage.getItem("access");

         const response = await API.patch(
            `/api/complaints/${id}/edit_fields/`,
            editedData,
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         setComplaint(response.data);
         setIsEditing(false);
         setErrorMessage("");
      } catch (error) {
         setErrorMessage(error.response?.data?.error || "Something went wrong.");
      }
   };

   const handleDelete = async () => {
      const confirmDelete = window.confirm(
         "Are you sure you want to delete this complaint?"
      );

      if (!confirmDelete) return;

      try {
         const token = localStorage.getItem("access");

         await API.delete(
            `/api/complaints/${id}/`,
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         window.location.href = "/dashboard";

      } catch (error) {
         setErrorMessage(error.response?.data?.error || "Delete failed.");
      }
   };


   useEffect(() => {
      const fetchComplaint = async () => {
         try {
            const token = localStorage.getItem("access");

            const response = await API.get(
               `/api/complaints/${id}/`,
               {
                  headers: {
                     Authorization: `Bearer ${token}`,
                  },
               }
            );

            setComplaint(response.data);
         } catch (error) {
            console.error("Error fetching complaints:", error.response?.data);
         }
      };

      if (id) fetchComplaint();
   }, [id]);

   if (!complaint) return <div>Loading...</div>;

   const formattedCreatedDate = new Date(
      complaint.created_at
   ).toLocaleDateString("en-GB");

   const formattedUpdatedDate = complaint.updated_at
      ? new Date(complaint.updated_at).toLocaleDateString("en-GB")
      : "";

   const handleConfirm = async () => {
      try {
         const token = localStorage.getItem("access");

         await API.post(
            `/api/complaints/${id}/confirm_solution/`,
            { confirmed: true },
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         window.location.reload();
      } catch (error) {
         console.error(error.response?.data);
      }
   };

   const handleReopen = async () => {
      try {
         const token = localStorage.getItem("access");

         await API.post(
            `/api/complaints/${id}/confirm_solution/`,
            { confirmed: false },
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
            }
         );

         window.location.reload();
      } catch (error) {
         console.error(error.response?.data);
      }
   };



   const isAuthorityResolved = complaint.status?.toUpperCase().trim() === "RESOLVED_BY_AUTHORITY";

   return (
      <div className="max-w-6xl mx-auto space-y-6">
         <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
         >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
         </Link>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                  <div className="flex flex-wrap gap-3 mb-4">
                     <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                        {complaint.status?.replace("_", " ").toUpperCase()}
                     </span>
                     {complaint.status === "PENDING" && (
                        <div className="flex gap-2 ml-4">
                           {!isEditing ? (
                              <>
                                 <button
                                    onClick={() => {
                                       setIsEditing(true);
                                       setEditedData({
                                          title: complaint.title,
                                          description: complaint.description,
                                          location: complaint.location,
                                       });
                                    }}
                                    className="px-4 py-1 text-xs font-semibold bg-gray-900 text-white rounded-full hover:bg-gray-700 transition"
                                 >
                                    Edit
                                 </button>

                                 <button
                                    onClick={handleDelete}
                                    className="px-4 py-1 text-xs font-semibold bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                 >
                                    Delete
                                 </button>
                              </>
                           ) : (
                              <>
                                 <button
                                    onClick={handleSave}
                                    className="px-4 py-1 text-xs font-semibold bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                                 >
                                    Save
                                 </button>

                                 <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-1 text-xs font-semibold bg-gray-400 text-white rounded-full hover:bg-gray-500 transition"
                                 >
                                    Cancel
                                 </button>
                              </>
                           )}
                        </div>
                     )}

                  </div>

                  {isEditing ? (
                     <input
                        value={editedData.title}
                        onChange={(e) =>
                           setEditedData({ ...editedData, title: e.target.value })
                        }
                        className="text-2xl font-bold text-gray-900 mb-2 w-full border rounded-lg px-3 py-2"
                     />
                  ) : (
                     <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {complaint.title}
                     </h1>
                  )}

                  <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-500 mt-4">
                     <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{complaint.user}</span>
                     </div>

                     <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formattedCreatedDate}</span>
                     </div>

                     <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {isEditing ? (
                           <input
                              value={editedData.city}
                              onChange={(e) =>
                                 setEditedData({ ...editedData, city: e.target.value })
                              }
                              className="border rounded-lg px-2 py-1 text-sm"
                           />
                        ) : (
                           <span>{complaint.city}</span>
                        )}
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Description</h3>
                  {isEditing ? (
                     <textarea
                        value={editedData.description}
                        onChange={(e) =>
                           setEditedData({ ...editedData, description: e.target.value })
                        }
                        className="w-full border rounded-lg px-3 py-2 text-gray-700"
                        rows={4}
                     />
                  ) : (
                     <p className="text-gray-600 leading-relaxed">
                        {complaint.description}
                     </p>
                  )}
               </div>

               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">Issue Photo</h3>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 relative">
                     <img
                        src={
                           complaint.image?.startsWith("http")
                              ? complaint.image
                              : `http://127.0.0.1:8000${complaint.image}`
                        }
                        alt="Evidence"
                        className="w-full h-full object-cover"
                     />
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-6">Timeline</h3>

                  <div className="space-y-8 relative pl-2">
                     <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                     <div className="relative flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center relative z-10 shrink-0">
                           <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-900">Submitted</p>
                           <p className="text-xs text-gray-500 mt-0.5">
                              Complaint submitted by citizen
                           </p>
                           <p className="text-[10px] text-gray-400 mt-1">
                              {formattedCreatedDate} • {complaint.user}
                           </p>
                        </div>
                     </div>
                     {complaint.updated_at && (
                        <div className="relative flex gap-4">
                           <div className="w-8 h-8 rounded-full bg-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center relative z-10 shrink-0">
                              <Clock className="w-4 h-4 text-white" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-blue-700">
                                 {complaint.status?.replace("_", " ").toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                 Status updated
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                 {formattedUpdatedDate}
                              </p>
                           </div>
                        </div>
                     )}
                  </div>
                  {isAuthorityResolved && (
                     <div className="flex flex-col sm:flex-row gap-3 mt-6">

                        <button
                           onClick={handleConfirm}
                           className="w-full sm:w-auto px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                           Confirm Solved
                        </button>

                        <button
                           onClick={handleReopen}
                           className="w-full sm:w-auto px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                           Not Solved
                        </button>

                     </div>
                  )}


               </div>

               <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100">
                  <h3 className="font-bold text-gray-900 mb-4">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between">
                        <span className="text-gray-500">Complaint ID</span>
                        <span className="font-mono font-medium text-gray-900">
                           {complaint.id}
                        </span>
                     </div>

                     <div className="flex justify-between">
                        <span className="text-gray-500">Category</span>
                        <span className="font-medium text-gray-900">
                           {complaint.category.replace("_", " ").toLowerCase()}
                        </span>
                     </div>

                     <div className="flex justify-between pt-3 border-t border-blue-100">
                        <span className="text-gray-500">Submitted</span>
                        <span className="font-medium text-gray-900">
                           {formattedCreatedDate}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ComplaintDetailView;
