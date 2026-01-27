import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { 
  LayoutGrid, ClipboardList, TrendingUp, Box, Eye, Edit3, X, 
  MapPin, Phone, Mail, Briefcase, GraduationCap, Award 
} from 'lucide-react';

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // The paths here must match your Route definitions in App.js
  const stats = [
    { 
      label: "Dashboard", 
      value: "Active Views", 
      icon: <LayoutGrid size={20} />, 
      color: "text-blue-500", 
      bg: "bg-blue-50",
      path: "/employee-dashboard" 
    },
    { 
      label: "Project / Client", 
      value: "12 Pending", 
      icon: <ClipboardList size={20} />, 
      color: "text-purple-500", 
      bg: "bg-purple-50",
      path: "/clients" 
    },
    { 
      label: "KPI's", 
      value: "94% Target", 
      icon: <TrendingUp size={20} />, 
      color: "text-green-500", 
      bg: "bg-green-50",
      path: "/performance" 
    },
    { 
      label: "DDTME", 
      value: "8 Metrics", 
      icon: <Box size={20} />, 
      color: "text-orange-500", 
      bg: "bg-orange-50",
      path: "/metrics" 
    },
  ];

  const skills = [
    { name: "React / Next.js", level: 95 },
    { name: "Cloud Architecture", level: 88 },
    { name: "Project Management", level: 82 },
    { name: "System Design", level: 90 }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Navbar: Setting hideLogin to true ensures the Login button is hidden */}
      <Navbar hideLogin={true} />

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-10 animate-in fade-in duration-700">
        
        {/* 2. Interactive Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <button 
              key={index} 
              onClick={() => navigate(stat.path)}
              className="text-left bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-[#F58A4B]/30 hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 tracking-tight mt-1">{stat.value}</p>
              <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-[#F58A4B] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                Go to Module <span>→</span>
              </div>
            </button>
          ))}
        </div>

        {/* 3. Main Profile Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row items-center gap-10">
          <div className="relative group cursor-pointer" onClick={() => setShowModal(true)}>
            <img 
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256" 
              alt="John Doe" 
              className="w-40 h-40 rounded-full border-2 border-slate-100 object-cover shadow-xl group-hover:scale-105 transition-transform"
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-lg">Professional Profile</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mt-4">John Doe</h1>
            <p className="text-lg text-slate-500 font-medium mt-1">Senior Software Architect</p>

            <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
              >
                <Eye size={16} /> View Detailed Bio
              </button>
              <button className="bg-white border border-slate-200 text-slate-600 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- BIO POPUP MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 relative">
            
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>

            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-start border-b border-slate-100 pb-8 mb-8">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256" className="w-24 h-24 rounded-2xl object-cover shadow-md" alt="John" />
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">John Doe</h2>
                  <p className="text-indigo-600 font-bold uppercase text-xs tracking-widest mt-1">Employee ID: HQ-2026-084</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Contact Details</h3>
                    <div className="space-y-3 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-3"><Mail size={16} className="text-indigo-500" /> john.doe@hqepl.com</div>
                      <div className="flex items-center gap-3"><Phone size={16} className="text-indigo-500" /> +91 98765 43210</div>
                      <div className="flex items-center gap-3"><MapPin size={16} className="text-indigo-500" /> Vadodara, Gujarat</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Background</h3>
                    <div className="space-y-3 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-3"><Briefcase size={16} className="text-indigo-500" /> 12+ Years Exp.</div>
                      <div className="flex items-center gap-3"><GraduationCap size={16} className="text-indigo-500" /> M.Tech Cloud</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Expertise</h3>
                  <div className="space-y-5">
                    {skills.map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{skill.name}</span>
                          <span className="text-xs font-black text-indigo-600">{skill.level}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${skill.level}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100">
                {/* Enter Full Dashboard Button */}
                <button 
                  onClick={() => navigate('/employee-dashboard')}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  Enter Full Dashboard <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;