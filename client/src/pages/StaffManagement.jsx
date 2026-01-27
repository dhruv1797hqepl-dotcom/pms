import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, UserPlus, Search, Mail, Calendar,
    ShieldCheck, ChevronLeft, MoreVertical,
    CheckCircle2, XCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
// Import your axios instance or api service
import api from '../api';

const StaffManagement = () => {
    const navigate = useNavigate();
    const [staffMembers, setStaffMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // Fetch data from backend
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                setLoading(true);
                // Replace with your actual endpoint
                const response = await api.get('admin/userlist/');
                setStaffMembers(response.data);
            } catch (error) {
                console.error("Error fetching staff:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const filteredStaff = staffMembers.filter(member =>
        member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to format Django date strings
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 antialiased pb-20">
            <Navbar hideLogin={true} />

            <main className="max-w-[1600px] mx-auto px-10 pt-4 space-y-10">

                {/* Navigation & Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[#F58A4B] font-black text-[10px] uppercase tracking-[0.2em] hover:translate-x-[-4px] transition-transform"
                        >
                            <ChevronLeft size={16} /> Back to Dashboard
                        </button>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Staff <span className="text-[#F58A4B]">Directory</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#F58A4B] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="pl-14 pr-8 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#F58A4B] w-80 shadow-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/admin/createuser')}
                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#F58A4B] transition-all shadow-xl flex items-center gap-3"
                        >
                            <UserPlus size={18} /> Create Staff
                        </button>
                    </div>
                </div>

                {/* Staff Table */}
                <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-4">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 pb-4">Member Identity</th>
                                    <th className="px-8 pb-4">Access Role</th>
                                    <th className="px-8 pb-4 text-center">Active Status</th>
                                    <th className="px-8 pb-4 text-center">Date Joined</th>
                                    <th className="px-8 pb-4 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-10 font-bold text-slate-400">Loading Directory...</td></tr>
                                ) : filteredStaff.map((member) => (
                                    <tr key={member.id} className="bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all group cursor-pointer border border-transparent hover:border-slate-100">
                                        {/* User Identity (Logo/Avatar, Username, Email) */}
                                        <td className="px-8 py-6 rounded-l-[2rem]">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-slate-900 text-[#F58A4B] rounded-2xl flex items-center justify-center font-black shadow-lg group-hover:bg-[#F58A4B] group-hover:text-white transition-colors">
                                                    {member.username?.[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">{member.username}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                        <Mail size={10} /> {member.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Access Role */}
                                        <td className="px-8 py-6">
                                            <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest ${member.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' :
                                                    member.role === 'SGM' ? 'bg-orange-50 text-[#F58A4B]' :
                                                        'bg-slate-100 text-slate-500'
                                                }`}>
                                                {member.role || 'Employee'}
                                            </span>
                                        </td>

                                        {/* Active Status (is_active) */}
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                {member.is_active ? (
                                                    <CheckCircle2 className="text-emerald-500" size={20} />
                                                ) : (
                                                    <XCircle className="text-slate-300" size={20} />
                                                )}
                                            </div>
                                        </td>

                                        {/* Date Joined */}
                                        <td className="px-8 py-6 text-center">
                                            <p className="text-[11px] font-black text-slate-700 flex items-center justify-center gap-2">
                                                <Calendar size={14} className="text-slate-300" />
                                                {formatDate(member.date_joined)}
                                            </p>
                                        </td>

                                        {/* Operations */}
                                        <td className="px-8 py-6 rounded-r-[2rem] text-right">
                                            <button className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Analytics Footer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex items-center justify-between shadow-2xl">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Staff</p>
                            <p className="text-3xl font-black mt-1">{staffMembers.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffManagement;