import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, ChevronLeft, Filter, ArrowRight, X, User,
  Briefcase, FileText, Mail, Shield, Key, Eye, EyeOff
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api';

/* ───────────────────────── 1. CREATE TEAM MEMBER MODAL ───────────────────────── */

const CreateTeamMemberModal = ({ isOpen, onClose, onMemberAdded, clientId }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', username: '', password: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`clients/${clientId}/members/`, {
        email: formData.email,
        username: formData.username,
        password: formData.password,

      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onMemberAdded();
      onClose();
    } catch (error) {
      console.error("Error creating team member:", error);
      alert("Failed to create credentials. Check if email is unique.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Client <span className="text-[#f5914e]">Access</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 ml-4">Full Name</label>
              <input required className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-[#f5914e] outline-none"
                placeholder="Michael Chen" onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input required type="email" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-[#f5914e] outline-none"
                  placeholder="m.chen@client.com" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 ml-4">Set Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input required type={showPassword ? "text" : "password"} className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:border-[#f5914e] outline-none"
                  placeholder="••••••••" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#f5914e] transition-all shadow-xl">
              {loading ? 'Provisioning...' : 'Generate Credentials'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── 2. CREATE PROJECT MODAL ───────────────────────── */

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated, clientId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', internal_lead: '', external_lead: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`projects/`, {
        name: formData.name,
        internal_lead: formData.internal_lead ? Number(formData.internal_lead) : null,
        external_lead: formData.external_lead ? Number(formData.external_lead) : null,
        client_org: clientId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onProjectCreated();
      onClose();
    } catch (error) {
      console.error("Create project error:", error.response?.data);
      console.error("Status:", error.response?.status);
      alert(
        error.response?.data?.detail ||
        JSON.stringify(error.response?.data) ||
        "Failed to create project."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">New <span className="text-[#f5914e]">Project</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            placeholder="Project Name" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            placeholder="Internal Lead (ID)" onChange={(e) => setFormData({ ...formData, internal_lead: e.target.value })} />
          <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none"
            placeholder="External Lead (ID)" onChange={(e) => setFormData({ ...formData, external_lead: e.target.value })} />
          <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#f5914e] transition-all">Launch Project</button>
        </form>
      </div>
    </div>
  );
};

/* ───────────────────────── 3. PROJECT CARD ───────────────────────── */

const ProjectCard = ({ name, status, internalLead, externalLead, progress, onShowDetail }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 flex flex-col transition-all hover:shadow-2xl hover:translate-y-[-4px]">
      <div className="flex justify-between items-start mb-6">
        <div className="max-w-[70%]">
          <h3 className="font-black text-slate-900 text-xl tracking-tight leading-tight">{name}</h3>
          <p className="text-[#f5914e] text-[9px] font-black uppercase mt-1 tracking-[0.2em]">Active Compliance Module</p>
        </div>
        <span className="text-[9px] px-3 py-1.5 rounded-full font-black bg-emerald-50 text-emerald-600 uppercase tracking-widest border border-emerald-100">
          {status}
        </span>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Velocity</span>
          <span className="text-[10px] font-black text-slate-900">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-[#f5914e] h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="space-y-4 mb-8 pt-6 border-t border-slate-50 text-[10px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Internal SGM</span>
          <span className="font-black text-slate-900">{internalLead}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold uppercase tracking-wider">External Lead</span>
          <span className="font-black text-slate-900">{externalLead}</span>
        </div>
      </div>

      <button onClick={onShowDetail} className="w-full py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 hover:bg-[#f5914e] transition-all group">
        View Detail Analysis <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

/* ───────────────────────── 4. MAIN PAGE COMPONENT ───────────────────────── */

export default function ClientProjects() {
  const { clientId, clientName } = useParams();
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');

      // Fetch Projects
      const projRes = await api.get(`projects/`, { headers: { Authorization: `Bearer ${token}` } });
      setProjects(projRes.data.filter(p => String(p.client_org) === String(clientId)));

      // Fetch Team Members
      const teamRes = await api.get(`clients/${clientId}/members/`, { headers: { Authorization: `Bearer ${token}` } });
      setTeamMembers(teamRes.data);
    } catch (error) {
      console.error("Fetch error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

    }
  };

  useEffect(() => { fetchData(); }, [clientId]);

  const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(filterQuery.toLowerCase()));

  return (
    <div className="bg-[#fcfcfc] min-h-screen antialiased">
      <Navbar hideLogin={true} />

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={fetchData} clientId={clientId} />
      <CreateTeamMemberModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} onMemberAdded={fetchData} clientId={clientId} />

      <div className="max-w-7xl mx-auto px-8 pt-10 pb-20">
        <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-[#f5914e] font-black text-[10px] uppercase tracking-[0.2em] mb-12 hover:translate-x-[-4px] transition-transform">
          <ChevronLeft size={16} /> Back to Directory
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
              {decodeURIComponent(clientName)} <span className="text-[#f5914e]">Projects</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Strategic Certification Management</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setIsTeamModalOpen(true)} className="px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-[#f5914e] transition-all flex items-center gap-2">
              <Shield size={14} className="text-[#f5914e]" /> Team Credentials
            </button>
            <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#f5914e] transition-all flex items-center gap-3 shadow-xl active:scale-95">
              <Plus size={18} strokeWidth={3} /> New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* PROJECT LIST */}
          <div className="lg:col-span-3">
            <div className="mb-8 relative max-w-sm">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input type="text" placeholder="Filter projects..." className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-[#f5914e]" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} />
            </div>

            {projects.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                <p className="text-slate-300 font-black uppercase tracking-widest">No projects launched</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredProjects.map((proj) => (
                  <ProjectCard key={proj.id} name={proj.name} status={proj.status || "active"} internalLead={proj.internal_lead_email || "—"} externalLead={proj.external_lead_email || "—"} progress={proj.overall_progress || 0} onShowDetail={() => navigate(`/clients/${clientId}/${clientName}/${encodeURIComponent(proj.name)}`)} />
                ))}
              </div>
            )}
          </div>

          {/* EXTERNAL TEAM SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm sticky top-24">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-6">External Team</h3>
              <div className="space-y-6">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-[#f5914e] group-hover:text-white transition-all">
                      {member.username?.charAt(0) || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-slate-900 truncate">{member.username}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate lowercase">{member.email}</p>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-300 text-center py-4 uppercase">No members</p>
                )}
                <button onClick={() => setIsTeamModalOpen(true)} className="w-full mt-4 py-3 border-2 border-dashed border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-[#f5914e] hover:text-[#f5914e] transition-all">
                  + Add Member Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}