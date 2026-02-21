import React from "react";
import { Upload, MapPin, Camera, Navigation, Send } from "lucide-react";
import API from "../../../services/api";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";


const ReportIssueForm = () => {
   const navigate = useNavigate();

   const [formData, setFormData] = useState({
      title: "",
      description: "",
      category: "",
      street: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      image: null,
   });
   const fileInputRef = useRef(null);


   const handleChange = (e) => {
      setFormData({
         ...formData,
         [e.target.name]: e.target.value,
      });
   };


   const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
         setFormData({
            ...formData,
            image: file,
         });
      }
   };


   const handleSubmit = async (e) => {
      e.preventDefault();

      const token = localStorage.getItem("access");

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("street", formData.street);
      data.append("area", formData.area);
      data.append("city", formData.city);
      data.append("state", formData.state);
      data.append("pincode", formData.pincode);
      if (formData.image) {
         data.append("image", formData.image);
      }

      try {
         await API.post(
            "/api/complaints/",
            data,
            {
               headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "multipart/form-data",
               },
            }
         );
         navigate("/dashboard");
      } catch (error) {
         console.log("Full error:", error);
         console.log("Response data:", error.response?.data);
         alert(JSON.stringify(error.response?.data));
      }
   };



   return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-0 space-y-10">

         <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
               Report Civic Issue
            </h1>
            <p className="text-gray-500 mt-2 text-base sm:text-lg">
               Help us improve our community by reporting civic issues that need attention.
            </p>
         </div>

         <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-5 sm:p-8">

            <form onSubmit={handleSubmit} className="space-y-8">

               <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-900">
                     Issue Photo
                  </label>
                  <p className="text-sm text-gray-500">
                     Upload a clear photo of the issue
                  </p>

                  <div
                     onClick={() => fileInputRef.current.click()}
                     className="border-2 border-dashed border-gray-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                     <div className="w-14 h-14 bg-blue-50 text-[#1E3A8A] rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6" />
                     </div>

                     <h3 className="font-bold text-gray-900">
                        {formData.image ? formData.image.name : "Drop image here or browse"}
                     </h3>

                     <p className="text-sm text-gray-400 mt-2">
                        PNG, JPG up to 10MB
                     </p>
                  </div>

                  <input
                     type="file"
                     ref={fileInputRef}
                     onChange={handleImageChange}
                     accept="image/*"
                     className="hidden"
                  />

               </div>

               <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                     Issue Title *
                  </label>
                  <input
                     type="text"
                     name="title"
                     onChange={handleChange}
                     placeholder="Brief title of the issue"
                     className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base font-medium"
                  />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-900">
                        Category *
                     </label>
                     <select name="category" onChange={handleChange} className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base cursor-pointer">
                        <option value="GARBAGE">Garbage</option>
                        <option value="STREETLIGHT">Street Light</option>
                        <option value="POTHOLE">Pothole</option>
                        <option value="WATER_LEAKAGE">Water Leakage</option>
                        <option value="DRAINAGE">Drainage</option>
                        <option value="OTHER">Other</option>
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-900">
                        Street *
                     </label>
                     <div className="relative">
                        <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                           type="text"
                           name="street"
                           onChange={handleChange}
                           placeholder="Street address or landmark"
                           className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-900">
                        Area *
                     </label>
                     <div className="relative">
                        <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                           type="text"
                           name="area"
                           onChange={handleChange}
                           placeholder="Area"
                           className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-900">
                        City *
                     </label>
                     <div className="relative">
                        <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                           type="text"
                           name="city"
                           onChange={handleChange}
                           placeholder="City"
                           className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-900">
                        State *
                     </label>
                     <div className="relative">
                        <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                           type="text"
                           name="state"
                           onChange={handleChange}
                           placeholder="State"
                           className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-900">
                        Pincode *
                     </label>
                     <div className="relative">
                        <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                           type="text"
                           name="pincode"
                           maxLength="6"
                           inputMode="numeric"
                           onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                           onChange={handleChange}
                           placeholder="Pincode"
                           className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base"
                        />
                     </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                     Detailed Description *
                  </label>
                  <textarea
                     rows="4"
                     name="description"
                     onChange={handleChange}
                     placeholder="Provide detailed information..."
                     className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50 focus:bg-white focus:border-[#1E3A8A] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm sm:text-base resize-none"
                  />
               </div>

               <div className="pt-2 flex flex-col sm:flex-row gap-4">
                  <button
                     type="submit"
                     className="hover:cursor-pointer px-6 sm:px-8 py-3 sm:py-4 bg-[#1E3A8A] text-white font-semibold rounded-xl sm:rounded-2xl hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 text-sm sm:text-base"
                  >
                     <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                     Submit Complaint
                  </button>

                  <button
                     type="button"
                     onClick={() => window.history.back()}
                     className="hover:cursor-pointer px-6 sm:px-8 py-3 sm:py-4 bg-sky-50 text-sky-700 font-semibold rounded-xl sm:rounded-2xl hover:bg-sky-100 transition-colors text-sm sm:text-base"
                  >
                     Cancel
                  </button>
               </div>
            </form>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#1E3A8A] mb-4">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
               </div>
               <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Clear Photo
               </h3>
               <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  Take a well-lit photo showing the complete issue.
               </p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
               </div>
               <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Accurate Location
               </h3>
               <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  Provide precise location details for faster response.
               </p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-sky-600 mb-4">
                  <Navigation className="w-5 h-5 sm:w-6 sm:h-6" />
               </div>
               <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  Detailed Info
               </h3>
               <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  Include time and hazard details for quicker resolution.
               </p>
            </div>

         </div>
      </div>
   );
};

export default ReportIssueForm;
