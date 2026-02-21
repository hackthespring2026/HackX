import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    User,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreHorizontal,
    MessageSquare
} from "lucide-react";
import API from "../../../services/api";
import { useParams, Link } from "react-router-dom";

const AdminComplaintView = () => {
    const { id } = useParams();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const statusOptions = [
        { value: "PENDING", label: "Pending", color: "bg-orange-100 text-orange-700" },
        { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-700" },
        { value: "RESOLVED_BY_AUTHORITY", label: "Resolved", color: "bg-emerald-100 text-emerald-700" },
    ];

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                const token = localStorage.getItem("access");
                const response = await API.get(
                    `/api/complaints/${id}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setComplaint(response.data);
                setSelectedStatus(response.data.status);
            } catch (error) {
                console.error("Error fetching complaint:", error);
                setError("Failed to load complaint data.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchComplaint();
    }, [id]);

    const handleSaveStatus = async () => {
        if (!selectedStatus || selectedStatus === complaint.status) return;
        setIsUpdating(true);
        try {
            const token = localStorage.getItem("access");
            await API.patch(
                `/api/complaints/${id}/update_status/`,
                { status: selectedStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComplaint({ ...complaint, status: selectedStatus });
            alert("Status updated successfully!");
        } catch (error) {
            console.error("Error updating status:", error);
            alert(error.response?.data?.error || "Failed to update status.");
            setSelectedStatus(complaint.status);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500">
            <AlertCircle size={48} className="mb-4 text-red-100 fill-red-500" />
            <p className="font-semibold">{error}</p>
        </div>
    );

    if (!complaint) return <div>Complaint not found</div>;

    const timelineSteps = [
        { key: "PENDING", label: "Submitted & Pending", date: complaint.created_at },
        { key: "IN_PROGRESS", label: "Processing", date: null },
        { key: "RESOLVED_BY_AUTHORITY", label: "Resolution Provided", date: null },
        { key: "CLOSED", label: "Closed & Verified", date: null }
    ];

    const currentStatusConfig = statusOptions.find(s => s.value === complaint.status) || {
        color: "bg-slate-100 text-slate-700",
        label: complaint.status.replace(/_/g, " ")
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">

            <div className="flex items-center gap-4">
                <Link to="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-slate-900">Complaint #{complaint.id}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${currentStatusConfig.color}`}>
                            {currentStatusConfig.label}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-8">

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                        <div className="p-8 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Subject</span>
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                {complaint.title}
                            </h2>
                        </div>

                        <div className="p-8">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Description</span>
                            <p className="text-slate-600 leading-relaxed text-base">
                                {complaint.description}
                            </p>


                            {complaint.image && (
                                <div className="mt-8">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Attachment</span>
                                    <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                        <img
                                            src={complaint.image}
                                            alt="Complaint Evidence"
                                            className="w-full h-auto max-h-[500px] object-contain"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/800x400?text=Image+Load+Error";
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 opacity-50 pointer-events-none grayscale">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-slate-900">User Feedback</h3>
                        </div>
                        <p className="text-slate-500 italic">No feedback submitted yet.</p>
                    </div>

                </div>

                <div className="space-y-6">

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Update Status</h3>

                        <div className="space-y-4">
                            <div className="relative">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-shadow"
                                    disabled={complaint.status === 'CLOSED'}
                                >
                                    {statusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveStatus}
                                disabled={isUpdating || selectedStatus === complaint.status || complaint.status === 'CLOSED'}
                                className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all
                                    ${isUpdating || selectedStatus === complaint.status || complaint.status === 'CLOSED'
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                                    }`}
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>

                            {complaint.status === 'CLOSED' && (
                                <p className="text-xs text-center text-slate-400 bg-slate-50 py-2 rounded-lg">
                                    This complaint is closed and locked.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">Details</h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Reported By</p>
                                    <p className="text-sm font-semibold text-slate-900">{complaint.user}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Date Submitted</p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {new Date(complaint.created_at).toLocaleDateString("en-GB", {
                                            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase">Location</p>
                                    <p className="text-sm font-semibold text-slate-900">{complaint.location}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wide">Progress Timeline</h3>

                        <div className="relative pl-2 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                            {timelineSteps.map((step, idx) => {
                                const isActive = idx <= (
                                    complaint.status === 'CLOSED' ? 3 :
                                        complaint.status === 'RESOLVED_BY_AUTHORITY' ? 2 :
                                            complaint.status === 'IN_PROGRESS' ? 1 : 0
                                );

                                return (
                                    <div key={step.key} className="relative flex items-center gap-4">
                                        <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                            ${isActive ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}
                                        `}>
                                            {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wide ${isActive ? "text-blue-700" : "text-slate-400"}`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AdminComplaintView;
