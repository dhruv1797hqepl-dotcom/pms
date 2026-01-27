import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ShieldCheck, Globe, Users, 
  Award, CheckCircle, ExternalLink, Layers, 
  TrendingUp, Eye, Edit3
} from 'lucide-react';
import Navbar from '../../components/Navbar';

// Replace this with your actual logo path
const COMPANY_LOGO = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200&h=200";

const HQEPLProfile = () => {
  const navigate = useNavigate();

  const hqeplStats = [
    { 
      label: "DASHBOARD", 
      value: "Active Views", 
      icon: <Layers size={20} />, 
      color: "text-blue-500", 
      bg: "bg-blue-50",
      path: "/admin/dashboard"
    },
    { 
      label: "PROJECT / CLIENT", 
      value: "12 Pending", 
      icon: <CheckCircle size={20} />, 
      color: "text-purple-500", 
      bg: "bg-purple-50",
      path: "/sgm/clients"
    },
    { 
      label: "KPI'S", 
      value: "94% Target", 
      icon: <TrendingUp size={20} />, 
      color: "text-emerald-500", 
      bg: "bg-emerald-50",
      path: "/admin/dashboard"
    },
    { 
      label: "", 
      value: "company level objective dashboard", 
      icon: <ShieldCheck size={20} />, 
      color: "text-orange-500", 
      bg: "bg-orange-50",
      path: "/hqepl/companyobjectives"
    },
  ];

  const clients = [
    { id: 1, name: "Stripe, Inc.", sector: "Fintech", projects: 12, status: "Active" },
    { id: 2, name: "Apple Global", sector: "Technology", projects: 8, status: "Completed" },
    { id: 3, name: "Netflix", sector: "Entertainment", projects: 5, status: "Active" },
    { id: 4, name: "Reliance Ind.", sector: "Energy", projects: 15, status: "Active" },
  ];

  return (
    <div className="min-h-screen bg-white antialiased pb-20">
      <Navbar hideLogin={true} />

      <main className="max-w-7xl mx-auto px-8 pt-32 space-y-12 animate-in fade-in duration-1000">
        
        {/* 1. TOP METRICS (Based on Image Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hqeplStats.map((stat, i) => (
            <div 
              key={i} 
              onClick={() => navigate(stat.path)}
              className="bg-white border border-slate-200 p-6 rounded-2xl transition-all cursor-pointer hover:shadow-md active:scale-95"
            >
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 2. COMPANY PROFILE HERO (Based on Image Style) */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden">
          {/* Company Logo Container */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center">
              <img 
    
                src="/HqeplLOGO.png" 
                alt="HQEPL Logo" 
                className="w-full h-full object-contain p-2"
              />  
            </div>  
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                HQEPL
              </h1>
              <p className="text-xl font-medium text-slate-500 italic">
                Strategic Operations & Compliance Architecture
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Eye size={18} /> View Detailed Bio
              </button>
              <button className="px-8 py-3.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* 3. CLIENT REGISTRY (Same as before) */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 px-4 gap-6">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3 mb-2">
                <Award size={18} className="text-indigo-600" /> Global Client Portfolio
              </h2>
              <p className="text-3xl font-black text-slate-900 tracking-tighter italic">
                Strategic Partners & <span className="text-indigo-600">Workspaces</span>
              </p>
            </div>
            <button 
              onClick={() => navigate('/sgm/clients')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-lg"
            >
              Explore All Clients <ExternalLink size={14} />
            </button>
          </div>

          <div className="overflow-x-auto px-2">
            <table className="w-full text-left border-separate border-spacing-y-4">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th className="px-6 pb-2">Organization</th>
                  <th className="px-6 pb-2">Sector</th>
                  <th className="px-6 pb-2">Live Projects</th>
                  <th className="px-6 pb-2 text-right">Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr 
                    key={client.id} 
                    onClick={() => navigate(`/sgm/clients/${encodeURIComponent(client.name)}`)}
                    className="bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group cursor-pointer border border-transparent hover:border-slate-100"
                  >
                    <td className="px-6 py-8 rounded-l-[1.5rem]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black shadow-lg group-hover:bg-indigo-600 transition-colors">
                          {client.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{client.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified Partner</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Building2 size={12} className="text-indigo-600" /> {client.sector}
                      </span>
                    </td>
                    <td className="px-6 py-8">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-indigo-500" />
                        <span className="font-black text-slate-900 text-sm">{client.projects}</span>
                      </div>
                    </td>
                    <td className="px-6 py-8 rounded-r-[1.5rem] text-right">
                      <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full ${
                        client.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default HQEPLProfile;