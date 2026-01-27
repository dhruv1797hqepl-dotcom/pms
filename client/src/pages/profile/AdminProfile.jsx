import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { 
  Users, Briefcase, LayoutGrid, UserPlus, 
  ChevronRight, Globe, ShieldCheck, PieChart 
} from 'lucide-react';

const AdminProfile = () => {
  const navigate = useNavigate();

  // Primary Action Cards (Top Row)
  const actionStats = [
    { 
      label: "Main Interface", 
      value: "Admin Dashboard", 
      icon: <LayoutGrid size={24} />, 
      path: "/admin/dashboard",
      color: "bg-blue-600" 
    },
    { 
      label: "User Management", 
      value: "Create New User", 
      icon: <UserPlus size={24} />, 
      path: "/admin/createuser",
      color: "bg-[#F58A4B]" 
    },
  ];

  // Organizational Metrics (Bottom Row)
  const metrics = [
    { label: "Total Employees", value: "124", icon: <Users size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Projects", value: "42", icon: <Briefcase size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Clients", value: "18", icon: <Globe size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      <Navbar hideLogin={true} />

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-8 animate-in fade-in duration-700">
        
        {/* 1. TOP SECTION: ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {actionStats.map((action, index) => (
            <button 
              key={index}
              onClick={() => navigate(action.path)}
              className={`${action.color} p-8 rounded-[2.5rem] text-white flex items-center justify-between group transition-all hover:scale-[1.02] shadow-xl shadow-slate-200`}
            >
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-2xl">
                  {action.icon}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">{action.label}</p>
                  <h2 className="text-3xl font-black tracking-tighter mt-1">{action.value}</h2>
                </div>
              </div>
              <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
            </button>
          ))}
        </div>

        {/* 2. MIDDLE SECTION: PROFILE & METRICS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Admin Info Card */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-slate-900 rounded-full translate-x-2 translate-y-2 opacity-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256" 
                alt="Admin Portrait" 
                className="relative w-40 h-40 rounded-full border-4 border-white object-cover shadow-2xl"
              />
            </div>

            <div className="flex-1 text-center md:text-left z-10">
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-full">
                System Administrator
              </span>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mt-6">Alex Sterling</h1>
              <p className="text-xl text-slate-400 font-medium mt-1 italic">Admin</p>
              
              <div className="mt-8 flex gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-emerald-500" /> Security Verified
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Metrics Stack */}
          <div className="lg:col-span-4 space-y-6">
            {metrics.map((metric, index) => (
              <div 
                key={index} 
                className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex items-center gap-6 hover:border-[#F58A4B]/30 transition-colors group"
              >
                <div className={`w-14 h-14 ${metric.bg} ${metric.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {metric.icon}
                </div>
                <div>
                  
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* 3. OPTIONAL: QUICK SYSTEM HEALTH */}
        
      </main>
    </div>
  );
};

export default AdminProfile;