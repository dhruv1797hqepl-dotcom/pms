import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Loader2, ArrowLeft, Briefcase, Calendar, 
  UserCircle, Activity, Info, ChevronRight
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

const ProjectDetails = () => {
  const { projectName } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectName]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const projRes = await axios.get(`${API_BASE}/projects/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Safety: Decode URL name and find project in the list
      const decodedName = decodeURIComponent(projectName);
      const currentProj = projRes.data.find(p => p.name === decodedName);
      
      if (!currentProj) {
        setError("Project workspace not found or access restricted.");
      } else {
        setProject(currentProj);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to connect to the system. Please check your login.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading State
  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fcfcfc]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#f5914e] mx-auto mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Workspace...</p>
      </div>
    </div>
  );

  // 2. Error or Not Found State (Prevents 'null' crash)
  if (error || !project) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-10 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <Info className="text-gray-300" size={32} />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter text-[#001529] mb-2">Access Error</h2>
      <p className="text-gray-400 text-sm font-medium max-w-xs mb-8">{error || "The project details could not be retrieved."}</p>
      <button 
        onClick={() => navigate('/dashboard')} 
        className="px-8 py-3 bg-[#001529] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
      >
        Return to Safety
      </button>
    </div>
  );

  // 3. Success State
  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#001529] p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#f5914e] mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Previous Page
        </button>

        {/* Project Profile Header */}
        <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-gray-100 shadow-xl shadow-gray-200/50 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gray-50/50 rounded-full -mr-40 -mt-40 z-0" />
          
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                project?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-[#f5914e]'
              }`}>
                {project?.status}
              </span>
              <span className="text-gray-200">|</span>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <Briefcase size={14}/> {project?.client_org_name}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
              {project?.name}
            </h1>
            
            <p className="text-gray-500 text-lg font-medium max-w-2xl leading-relaxed">
              {project?.description || "Ongoing consulting engagement focusing on organizational efficiency and quality management protocols."}
            </p>
          </div>
        </div>

        {/* Metrics & Authority Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Leads */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <UserCircle size={16} className="text-[#f5914e]"/> Lead Management
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[8px] font-black text-gray-300 uppercase mb-1 tracking-widest">Internal Lead (SGM)</p>
                <p className="font-bold text-[#001529]">{project?.internal_lead_name || 'System Assigned'}</p>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <p className="text-[8px] font-black text-gray-300 uppercase mb-1 tracking-widest">External Lead (Client)</p>
                <p className="font-bold text-[#001529]">{project?.external_lead_name || 'Client Side Authority'}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Activity size={16} className="text-[#f5914e]"/> Project Health
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Completion</p>
                  <p className="text-xs font-black text-[#f5914e]">{project?.overall_progress}%</p>
                </div>
                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#f5914e] h-full transition-all duration-1000" style={{ width: `${project?.overall_progress}%` }} />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-50 flex items-center gap-4">
                 <div className="flex-1">
                   <p className="text-[8px] font-black text-gray-300 uppercase mb-1 tracking-widest">Commenced</p>
                   <p className="font-bold text-xs">{project?.start_date || 'TBD'}</p>
                 </div>
                 <div className="flex-1 border-l pl-4 border-gray-100">
                   <p className="text-[8px] font-black text-gray-300 uppercase mb-1 tracking-widest">Deadline</p>
                   <p className="font-bold text-xs">{project?.end_date || 'TBD'}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Team Snapshot */}
          <div className="bg-[#001529] p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Team Capacity</h3>
              <p className="text-6xl font-black text-[#f5914e] tracking-tighter">{project?.team_member_details?.length || 0}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Field Resources Deployed</p>
            </div>
            <div className="flex items-center gap-2 text-[8px] font-black uppercase text-[#f5914e] mt-6 tracking-[0.2em] animate-pulse">
               Active Workspace
            </div>
          </div>
        </div>

        {/* Assigned Team Roster */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
            <Users className="text-[#f5914e]" size={24}/> Verified Project Team
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {project?.team_member_details?.length > 0 ? project.team_member_details.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-5 bg-gray-50/50 rounded-2xl border border-transparent hover:border-orange-100 transition-all hover:bg-white group">
                <div className="w-10 h-10 bg-[#001529] text-[#f5914e] rounded-xl flex items-center justify-center font-black text-xs group-hover:scale-110 transition-transform">
                  {member.initial}
                </div>
                <div>
                  <p className="text-sm font-black uppercase leading-none mb-1">{member.username}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{member.role}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No team members assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA to Subtasks */}
        <div className="mt-12 text-center">
            <button 
                onClick={() => navigate(`/client/${project.client_org_name}/${project.name}/tasks`)}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-[#001529] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-[#f5914e] hover:text-[#001529] transition-all"
            >
                View Task Breakdown <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;