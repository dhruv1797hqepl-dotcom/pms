import React from 'react';
import { LayoutGrid, Users, Calendar, Plus, ChevronRight } from 'lucide-react';

const ProjectList = ({ client, onBack, onSelectProject }) => {
  // Mock Data: In a real app, you would fetch projects where clientId === client.id
  const projects = [
    {
      id: 101,
      title: "ERP Transformation",
      status: "In Progress",
      teamSize: 12,
      deadline: "Dec 2026",
      progress: 65
    },
    {
      id: 102,
      title: "Supply Chain Automation",
      status: "Planning",
      teamSize: 5,
      deadline: "March 2026",
      progress: 15
    },
    {
      id: 103,
      title: "Digital Audit 2026",
      status: "Completed",
      teamSize: 8,
      deadline: "Jan 2026",
      progress: 100
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.4em] text-[#F58A4B] uppercase">
            Client: {client?.name || "Selected Client"}
          </span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mt-2">
            Active Projects
          </h2>
        </div>

        <button className="bg-slate-900 text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center gap-3 w-fit">
          <Plus size={16} /> Create New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {projects.map((project) => (
          <div 
            key={project.id}
            className="bg-slate-50/50 border-2 border-slate-300 p-10 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 group-hover:text-[#F58A4B] transition-colors shadow-sm">
                <LayoutGrid size={24} />
              </div>
              <span className={`text-[9px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full ${
                project.status === "Completed" ? "bg-green-100 text-green-700" : 
                project.status === "In Progress" ? "bg-blue-100 text-blue-700" : 
                "bg-orange-100 text-[#F58A4B]"
              }`}>
                {project.status}
              </span>
            </div>

            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
              {project.title}
            </h3>

            {/* Project Stats */}
            <div className="flex items-center gap-8 mb-10 text-slate-500">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{project.teamSize} Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{project.deadline}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completion</span>
                <span className="text-sm font-black text-slate-900">{project.progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#F58A4B] transition-all duration-1000" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Action */}
            <button 
              onClick={() => onSelectProject(project)}
              className="group/btn flex items-center justify-between w-full p-4 bg-white border-2 border-slate-300 rounded-2xl hover:bg-slate-900 hover:border-slate-900 transition-all duration-300"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 group-hover/btn:text-white transition-colors">
                Manage Project Team
              </span>
              <ChevronRight size={18} className="text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;