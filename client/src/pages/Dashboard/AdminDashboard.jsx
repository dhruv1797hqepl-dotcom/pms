import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Added Axios
import Navbar from '../../components/Navbar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Briefcase, Globe, TrendingUp, Building2, ExternalLink,
  Activity, AlertCircle, CheckCircle2, LayoutGrid, Layers, Loader2
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

// --- SUB-COMPONENT: ClientRegistry ---
// Logic: Passed "clients" as a prop from the parent
const ClientRegistry = ({ clients }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
            Global <span className="text-[#F58A4B]">Client Portfolio</span>
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Master Registry of Active Workspaces
          </p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-slate-100 px-6 py-3 rounded-xl transition-colors"
        >
          Detailed View <ExternalLink size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-4">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <th className="px-6 pb-2">Organization</th>
              <th className="px-6 pb-2">Sector</th>
              <th className="px-6 pb-2">Active Projects</th>
              <th className="px-6 pb-2">Oversight Status</th>
              <th className="px-6 pb-2 text-right">Growth</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                <td className="px-6 py-5 rounded-l-2xl">
                  <div className="flex items-center gap-4">
                    {client.logo ? (
                      <img src={client.logo} className="w-12 h-12 rounded-2xl object-cover shadow-lg" alt="" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-900 text-[#F58A4B] rounded-2xl flex items-center justify-center font-black shadow-lg">
                        {client.company_name?.[0] || 'C'}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-slate-900 text-sm">{client.company_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">HQEPL ID: 00{client.id}X</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Building2 size={12} className="text-[#F58A4B]" /> {client.industry || "General"}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-indigo-500" />
                    <span className="font-black text-slate-900 text-sm">{client.project_count || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${client.status === 'active'
                      ? 'bg-orange-50 text-[#F58A4B]'
                      : 'bg-emerald-50 text-emerald-600'
                    }`}>
                    {client.status || 'Active'}
                  </span>
                </td>
                <td className="px-6 py-5 rounded-r-2xl text-right">
                  <span className="text-sm font-black text-slate-900 tracking-tighter">--</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: AdminDashboard ---
const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Updated Logic: Backend States
  const [data, setData] = useState({ clients: [], projects: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const [clientRes, projectRes] = await Promise.all([
          axios.get(`${API_BASE}/clients/`, config),
          axios.get(`${API_BASE}/projects/`, config)
        ]);
        setData({ clients: clientRes.data, projects: projectRes.data });
      } catch (err) {
        console.log("Dashboard API error FULL:", error);

        if (error.response) {
          console.log("Status:", error.response.status);
          console.log("Data:", error.response.data);
          console.log("URL:", error.config?.url);
        } else {
          console.log("No response from server");
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDashboardData();
  }, [token]);

  // Map Backend Data to UI Summary
  const summary = [
    { label: "Active Organizations", value: data.clients.length, grow: "+New", icon: <Building2 size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Managed Projects", value: data.projects.length, grow: "Live", icon: <LayoutGrid size={20} />, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const chartData = [
    { name: 'Week 1', volume: 12 },
    { name: 'Week 2', volume: 19 },
    { name: 'Week 3', volume: 15 },
    { name: 'Week 4', volume: data.projects.length }, // Connected to data
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 antialiased pb-20">
      <Navbar hideLogin={true} />

      <main className="max-w-7xl mx-auto px-10 py-12 space-y-10">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
              Admin <span className="text-[#F58A4B]">Dashboard</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
              System Operations Oversight
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/staff')} // Updated path
              className="px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              <LayoutGrid size={16} /> Manage Staff
            </button>
            <button
              onClick={() => navigate('/clients')}
              className="px-10 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2"
            >
              <Building2 size={16} className="text-[#F58A4B]" /> + Create Client/Project
            </button>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {summary.map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm flex items-center justify-between group hover:border-[#F58A4B]/40 transition-all">
              <div className="flex items-center gap-6">
                <div className={`${stat.bg} ${stat.color} p-5 rounded-2xl group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">{stat.grow}</span>
            </div>
          ))}
        </div>

        {/* Analytics & Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
              <Activity size={18} className="text-[#F58A4B]" /> Portfolio Operations Velocity
            </h3>
            <div className="h-96 w-full min-h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="volume" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-60 italic">System Status</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-2 bg-white/10 rounded-lg h-fit text-orange-400">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Project Health: Optimized</p>
                    <p className="text-[9px] opacity-40 mt-1 font-bold uppercase tracking-widest">Active Monitoring On</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-2 bg-white/10 rounded-lg h-fit text-emerald-400">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Backend Connectivity</p>
                    <p className="text-[9px] opacity-40 mt-1 font-bold uppercase tracking-widest">Verified 1m ago</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#F58A4B] rounded-full blur-[80px] opacity-20"></div>
            </div>
          </div>
        </div>

        {/* Client Directory Registry - Passing backend data as prop */}
        <div className="mt-12">
          <ClientRegistry clients={data.clients} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;