import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, UserCheck, Calendar, CalendarIcon,
  ShieldCheck, Briefcase, Edit3, Share2, X,
  Clock, Target, CheckCircle2, Mail, Loader2, UserPlus, Lock
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api';

/* ───────────────────────── ASSIGN TEAM MODAL ───────────────────────── */
const AssignTeamModal = ({ isOpen, onClose, projectId, onAssigned, initialSelected = [] }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedEmployees(initialSelected);
  }, [initialSelected, isOpen]); // Reset when opening

  useEffect(() => {
    if (isOpen) {
      // Fetch internal employees
      const fetchEmployees = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const res = await api.get('sgm/employees/', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEmployees(res.data);
        } catch (error) {
          console.error("Failed to load employees", error);
        }
      };
      fetchEmployees();
    }
  }, [isOpen]);

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      await api.post(`sgm/projects/${projectId}/assign-team/`, {
        employees: selectedEmployees
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Assignment failed", error);
      alert("Failed to assign team");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black uppercase italic tracking-tighter">Assign <span className="text-[#F58A4B]">Workforce</span></h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => toggleEmployee(emp.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedEmployees.includes(emp.id)
                ? 'border-[#F58A4B] bg-orange-50'
                : 'border-slate-100 hover:bg-slate-50'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${selectedEmployees.includes(emp.id) ? 'bg-[#F58A4B] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {emp.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{emp.username}</p>
                  <p className="text-[10px] text-slate-400">{emp.email}</p>
                </div>
              </div>
              {selectedEmployees.includes(emp.id) && <CheckCircle2 size={16} className="text-[#F58A4B]" />}
            </div>
          ))}
          {employees.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No eligible employees found.</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || selectedEmployees.length === 0}
          className="w-full mt-6 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#F58A4B] transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Assign ${selectedEmployees.length} Members`}
        </button>
      </div>
    </div>
  );
};

export default function ProjectDetails() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]); // External Team
  const [userRole, setUserRole] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false); // Modal State

  const fetchData = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const role = (localStorage.getItem('role') || '').toUpperCase();
      setUserRole(role);
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Projects and filter using your exact existing logic
      let endpoint = `projects/${projectId}/`;

      if (role === 'SGM') {
        endpoint = `sgm/projects/${projectId}/`;
      }

      const projRes = await api.get(endpoint, { headers });
      setProject(projRes.data);


      // 2. Fetch Team Members for this client (Original Logic)

      setTeamMembers(projRes.data.external_team_details || projRes.data.external_team || []);


    } catch (error) {
      console.error("Fetch error:", error.response || error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [projectId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#F58A4B]" size={40} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Environment...</p>
        </div>
      </div>
    );
  }

  if (!project) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black uppercase text-slate-400">Instance Not Found</div>;

  return (
    <div className="min-h-screen bg-slate-50 antialiased font-sans pb-20">
      <Navbar hideLogin={true} />

      <main className="max-w-[1400px] mx-auto px-6 md:px-10 pt-8 space-y-8">

        {/* Navigation */}
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-4 hover:text-[#F58A4B] transition-all group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> BACK TO PROJECTS
        </button>

        {/* HERO SECTION */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-12">
            <div className="space-y-6 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${project.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                  }`}>
                  {project.status || 'ACTIVE'}
                </span>
                <p className="text-[#F58A4B] font-black flex items-center gap-2 text-xs uppercase tracking-widest">
                  <Briefcase size={16} /> {project.client?.company_name}

                </p>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                {project.name}
              </h1>

              <p className="text-slate-500 font-medium text-lg leading-relaxed border-l-4 border-[#F58A4B] pl-6 max-w-2xl">
                {project.description || "System environment initialized. Awaiting detailed scope documentation for this specific instance."}
              </p>
            </div>

            <div className="w-full lg:w-80 space-y-5 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Global <br /> Progress</span>
                <span className="text-4xl font-black text-slate-900">{project.overall_progress || 0}%</span>
              </div>
              <div className="w-full bg-white h-3 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-[#F58A4B] transition-all duration-1000 ease-out"
                  style={{ width: `${project.overall_progress || 0}%` }}
                />
              </div>
              <div className="pt-2 flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-tighter">
                <CheckCircle2 size={14} /> Node Connectivity: Active
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Timeline Protocol */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                <CalendarIcon className="text-[#F58A4B]" size={16} /> Timeline Tracking
              </h3>

              <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                <div className="relative pl-14">
                  <div className="absolute left-0 top-0.5 w-10 h-10 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                    <Calendar size={16} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialization</p>
                  <p className="text-base font-extrabold text-slate-900 mt-1">{project.start_date || 'N/A'}</p>
                </div>

                <div className="relative pl-14">
                  <div className="absolute left-0 top-0.5 w-10 h-10 bg-white border-2 border-[#F58A4B] rounded-2xl flex items-center justify-center shadow-sm">
                    <Clock size={16} className="text-[#F58A4B]" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Deadline</p>
                  <p className="text-base font-extrabold text-slate-900 mt-1">{project.end_date || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Directory Hub */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm h-full flex flex-col">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-2 pb-4 border-b border-slate-50">
                <Users className="text-[#F58A4B]" size={18} /> Management Directory
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 flex-1">
                {/* 1. Leads & Workforce Column */}
                <div className="space-y-8">
                  {/* Leads */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-[#F58A4B] pl-3">Strategic Leads</h4>
                    <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4 border border-slate-100 hover:border-[#F58A4B]/30 transition-colors group">
                      <div className="w-12 h-12 bg-slate-900 text-[#F58A4B] rounded-2xl flex items-center justify-center font-black group-hover:scale-105 transition-transform">S</div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Internal SGM</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{project.assigned_sgm_email || 'Not Assigned'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl flex items-center gap-4 border border-slate-100 hover:border-[#F58A4B]/30 transition-colors group">
                      <div className="w-12 h-12 bg-[#F58A4B] text-white rounded-2xl flex items-center justify-center font-black group-hover:scale-105 transition-transform">E</div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-slate-400 uppercase">External Lead</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{project.external_lead_email || 'Not Assigned'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Internal Workforce (SGM Space) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pr-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-slate-200 pl-3">Internal Workforce</h4>
                      {userRole === 'SGM' && (
                        <button onClick={() => setIsAssignModalOpen(true)} className="p-2 bg-slate-900 text-[#F58A4B] rounded-lg hover:bg-black transition-all shadow-sm">
                          <UserPlus size={16} />
                        </button>
                      )}
                    </div>

                    {/* Modal Injection */}
                    <AssignTeamModal
                      isOpen={isAssignModalOpen}
                      onClose={() => setIsAssignModalOpen(false)}
                      projectId={projectId}
                      onAssigned={fetchData}
                      initialSelected={project.team_members_details?.map(m => m.id) || []}
                    />
                    <div className="space-y-3">
                      {project.team_members_details?.length > 0 ? (
                        project.team_members_details.map((member, i) => (
                          <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 text-[#F58A4B] flex items-center justify-center text-[10px] font-black">{member.username?.[0].toUpperCase()}</div>
                              <p className="text-[12px] font-extrabold text-slate-800 uppercase tracking-tighter truncate">{member.username}</p>
                            </div>
                            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">No internal staff linked</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. External Team Column (Original Fetch) */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-emerald-400 pl-3">External Team Access</h4>
                  <div className="space-y-3">
                    {teamMembers.length > 0 ? (
                      teamMembers.map((member, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black group-hover:bg-slate-900 group-hover:text-[#F58A4B] transition-colors shrink-0">
                              {member.username?.[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[12px] font-extrabold text-slate-800 uppercase tracking-tighter truncate leading-none">{member.username}</p>
                              <p className="text-[8px] font-bold text-slate-400 lowercase mt-1 truncate">{member.email}</p>
                            </div>
                          </div>
                          <Lock size={12} className="text-slate-300 shrink-0" />
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] font-bold text-slate-300 italic uppercase">No external members provisioned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="mt-12 pt-8 border-t border-slate-50 flex flex-wrap gap-4">
                {(userRole === 'ADMIN' || userRole === 'SGM') && (
                  <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F58A4B] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                    <Edit3 size={18} /> Update Instance
                  </button>
                )}
                <button className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                  <Share2 size={18} /> Credentials Export
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}