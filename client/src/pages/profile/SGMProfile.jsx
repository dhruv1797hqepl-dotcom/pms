import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  Users, Briefcase, TrendingUp, Box, Eye, LayoutGrid, 
  Target, Globe, ShieldCheck, ChevronRight
} from 'lucide-react';

const SGMDashboard = () => {
  const navigate = useNavigate();

  // Management Stats for SGM
  const sgmStats = [
    { label: "Personal Dashboard", value: "Executive Summary", icon: <LayoutGrid size={20} />, color: "text-blue-600", bg: "bg-blue-50", path: "/sgm/personal" },
    { label: "Team Members", value: "Performance of Team", icon: <Users size={20} />, color: "text-purple-600", bg: "bg-purple-50", path: "/sgm/teams" },
    { label: "Clients / Projects", value: "18 Active Accounts", icon: <Briefcase size={20} />, color: "text-indigo-600", bg: "bg-indigo-50", path: "/sgm/clients" },
    { label: "KPI's", value: "98% Efficiency", icon: <Target size={20} />, color: "text-green-600", bg: "bg-green-50", path: "/sgm/kpis" },
    { label: "DDTME", value: "Strategic Metrics", icon: <Box size={20} />, color: "text-orange-600", bg: "bg-orange-50", path: "/sgm/ddtme" },
  ];

  // High-level Growth Data for Graphs
  const growthData = [
    { month: 'Oct', revenue: 4500, targets: 4000 },
    { month: 'Nov', revenue: 5200, targets: 4800 },
    { month: 'Dec', revenue: 6100, targets: 5500 },
    { month: 'Jan', revenue: 5900, targets: 5800 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      <Navbar hideLogin={true} />

      <main className="max-w-[1600px] mx-auto px-10 py-12 space-y-10 animate-in fade-in duration-700">
        
        {/* 1. EXECUTIVE METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {sgmStats.map((stat, index) => (
            <button 
              key={index} 
              onClick={() => navigate(stat.path)}
              className="text-left bg-white border border-slate-200 p-6 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:border-[#F58A4B]/30 transition-all duration-300 group"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 tracking-tight mt-1">{stat.value}</p>
            </button>
          ))}
        </div>

        {/* 2. SGM PROFILE HIGHLIGHT (Matches Employee Style) */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col lg:row items-center gap-10">
          <div className="relative">
            <div className="absolute inset-0 bg-slate-900 rounded-full translate-x-2 translate-y-2 opacity-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256" 
              alt="SGM Portrait" 
              className="w-44 h-44 rounded-full border-4 border-white object-cover shadow-2xl"
            />
            <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm"></div>
          </div>

          <div className="flex-1 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
               <span className="bg-orange-100 text-[#F58A4B] text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full w-fit mx-auto lg:mx-0">
                Senior General Manager
              </span>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full w-fit mx-auto lg:mx-0 flex items-center gap-2">
                <Globe size={12} /> Global Operations
              </span>
            </div>
            
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter mt-6">Robert Sterling</h1>
            <p className="text-xl text-slate-400 font-medium mt-1">Strategic Growth & Excellence</p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button className="flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                <Eye size={18} /> Executive Bio
              </button>
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                Team Settings
              </button>
            </div>
          </div>
        </div>

        {/* 3. PERFORMANCE GRAPHS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Revenue vs Targets Bar Chart */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#F58A4B]" /> Quarterly Growth Analysis
            </h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="revenue" fill="#F58A4B" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="targets" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xs font-bold uppercase tracking-[0.3em] mb-6 opacity-60">Management Quick Links</h4>
                <div className="space-y-4">
                  {['Approve Budgets', 'Team Realignment', 'Client Master List'].map((link) => (
                    <button key={link} className="w-full flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 group">
                      <span className="text-[11px] font-bold uppercase tracking-widest">{link}</span>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F58A4B] rounded-full blur-[80px] opacity-20"></div>
            </div>

            <div className="bg-white border-2 border-[#F58A4B]/20 p-8 rounded-[2rem] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-[#F58A4B] rounded-xl"><ShieldCheck size={24}/></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Status</p>
                  <p className="text-xl font-black text-slate-900">100% Secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SGMDashboard;