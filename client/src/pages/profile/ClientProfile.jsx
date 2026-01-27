import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { 
  ArrowLeft, ShieldCheck, Zap, Clock, Users, Info, Building2
} from 'lucide-react';
import api from '../../api'; // Your axios instance

const ClientProfile = () => {
  const { clientId, clientName } = useParams(); // Using ID for API, Name for URL
  const navigate = useNavigate();
  
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        
        // 1. Fetch Client Details
        const clientRes = await api.get(`clients/${clientId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClient(clientRes.data);

        // 2. Fetch Projects for this specific Client
        const projectsRes = await api.get(`projects/?client_id=${clientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(projectsRes.data);

      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchProfileData();
  }, [clientId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#F58A4B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!client) return <div className="p-20 text-center font-black uppercase text-slate-400">Client Profile Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50 antialiased pb-20">
      <Navbar hideLogin={true} />

      <main className="max-w-7xl mx-auto px-8 pt-32 space-y-10 animate-in fade-in duration-700">
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-[#F58A4B] font-black text-[10px] uppercase tracking-[0.3em] transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Portfolio
          </button>
        </div>

        {/* 1. CLIENT HEADER SECTION */}
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Real Logo from Backend */}
            {client.logo ? (
              <img 
                src={client.logo} 
                className="w-24 h-24 rounded-3xl object-cover shadow-2xl shrink-0 border-4 border-white" 
                alt={client.company_name} 
              />
            ) : (
              <div className="w-24 h-24 bg-slate-900 text-[#F58A4B] rounded-3xl flex items-center justify-center text-4xl font-black shadow-2xl shrink-0">
                {client.company_name[0]}
              </div>
            )}

            <div className="space-y-2 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                  {client.company_name}
                </h1>
                <span className="bg-orange-50 text-[#F58A4B] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Strategic Partner
                </span>
              </div>
              
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={18} className="text-emerald-500" /> Authorized HQEPL Strategic Partner
              </p>
            </div>
          </div>
        </div>

        {/* 2. PROJECT PORTFOLIO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3 ml-2">
              <Zap size={18} className="text-[#F58A4B]" /> Active Project Portfolio
            </h2>
            
            {projects.length === 0 ? (
              <div className="bg-white p-10 rounded-[2.5rem] text-center text-slate-300 font-black uppercase tracking-widest">
                No active projects found
              </div>
            ) : projects.map((project) => (
              <div key={project.id} className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-sm hover:border-[#F58A4B]/30 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                       <Clock size={14} className="text-[#F58A4B]" /> Status: {project.status}
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm bg-orange-50 text-[#F58A4B]">
                    {project.status}
                  </span>
                </div>
                
                {/* Progress Tracking */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-900 tracking-widest">
                    <span>Project Velocity</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-900 h-full rounded-full group-hover:bg-[#F58A4B] transition-all duration-1000 ease-out" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#F58A4B]"></div>
              
              <div className="space-y-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">HQEPL Consultant</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center font-bold text-slate-900 text-xs shrink-0">Lead</div>
                  <div>
                    <p className="font-black text-lg tracking-tight">{client.internal_lead || "Not Assigned"}</p>
                    <p className="text-[10px] font-bold text-[#F58A4B] uppercase tracking-widest">SGM Specialist</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 border-t border-white/10 pt-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Client Point</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-slate-900 text-xs shrink-0">CP</div>
                  <div>
                    <p className="font-black text-lg tracking-tight">{client.external_lead || "Not Assigned"}</p>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Contact Person</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-sm">
               <Building2 size={32} className="text-[#F58A4B] mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry Email</p>
               <p className="text-sm font-black text-slate-900 tracking-tighter truncate w-full">{client.contact_email}</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ClientProfile;