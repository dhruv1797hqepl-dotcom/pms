import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Users, UserCheck, LayoutList, 
  Calendar, ShieldCheck, Briefcase, ArrowRight,
  Share2, Edit3, CheckCircle2, Circle, Clock, Layers, ChevronDown
} from 'lucide-react';

// RECURSIVE TASK COMPONENT
const TaskRow = ({ task, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubTasks = task.subTasks && task.subTasks.length > 0;

  return (
    <div className="w-full">
      <div 
        className={`p-6 hover:bg-gray-50/40 transition-colors border-b border-gray-50 ${depth > 0 ? 'bg-gray-50/20' : ''}`}
        style={{ paddingLeft: `${(depth * 24) + 24}px` }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Task Info & Status */}
          <div 
            className="flex items-start gap-4 flex-1 cursor-pointer"
            onClick={() => hasSubTasks && setIsOpen(!isOpen)}
          >
            <div className="mt-1">
              {task.status === 'Completed' ? (
                <CheckCircle2 className="text-green-500" size={20} />
              ) : (
                <Circle className="text-gray-300" size={20} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`font-bold text-[#001529] text-base ${hasSubTasks ? 'hover:text-[#f5914e]' : ''}`}>
                  {task.name}
                </h4>
                {hasSubTasks && (
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                  />
                )}
              </div>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <UserCheck size={12} className="text-[#f5914e]" /> {task.assigned}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={12} /> {task.duration}
                </span>
              </div>
            </div>
          </div>

          {/* Task Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right mr-4 hidden md:block">
              <p className="text-[10px] font-black text-gray-400 uppercase">Deadline</p>
              <p className="text-xs font-bold text-[#001529]">{task.deadline}</p>
            </div>
            
            {hasSubTasks ? (
               <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#001529] text-white rounded-lg text-xs font-bold shadow-sm hover:bg-[#f5914e] transition-all"
              >
                <Layers size={14} /> {isOpen ? 'Hide' : 'Sub-Tasks'}
              </button>
            ) : (
              <button className="p-2 text-gray-300 hover:text-[#f5914e]">
                <Edit3 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RENDER NESTED SUB-TASKS (Recursion) */}
      {isOpen && hasSubTasks && (
        <div className="animate-in slide-in-from-top-1 duration-200">
          {task.subTasks.map((sub) => (
            <TaskRow key={sub.id} task={sub} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProjectDetails() {
  const navigate = useNavigate();
  const { clientName, projectName } = useParams();

  const projectInfo = {
    title: decodeURIComponent(projectName) || "ISO 9001:2015 Certification",
    client: decodeURIComponent(clientName) || "Global Manufacturing Ltd.",
    status: "Active",
    overallProgress: 65,
    duration: "4 Months (Jan - Apr 2026)",
    internalTeam: [
      { name: "Sarah Jenkins", role: "Project Manager", initial: "SJ" },
      { name: "Marcus Thorne", role: "Lead Auditor", initial: "MT" }
    ],
    externalLeads: [
      { name: "Dr. Alan Smith", role: "Technical Expert", initial: "AS" },
      { name: "Assign Legal", role: "Pending Assignment", initial: "+", isAction: true }
    ],
    clientTeam: [
      { name: "Elena Rodriguez", role: "Quality Manager", initial: "ER" },
      { name: "David Chen", role: "IT Coordinator", initial: "DC" }
    ],
    tasks: [
      { 
        id: "T1",
        name: "Initial Gap Analysis & Site Audit", 
        assigned: "Sarah Jenkins", 
        duration: "2 Weeks", 
        deadline: "Oct 20, 2023",
        status: "Completed",
        subTasks: [
          {
            id: "ST1-1",
            name: "Physical Site Inspection",
            assigned: "Sarah Jenkins",
            duration: "3 Days",
            deadline: "Oct 05, 2023",
            status: "Completed",
            subTasks: [
              {
                id: "SST1-1-1",
                name: "Warehouse Safety Check",
                assigned: "Assistant A",
                duration: "1 Day",
                deadline: "Oct 04, 2023",
                status: "Completed",
                subTasks: []
              }
            ]
          }
        ]
      },
      { 
        id: "T2",
        name: "Quality Manual & Documentation Draft", 
        assigned: "Marcus Thorne", 
        duration: "3 Weeks", 
        deadline: "Nov 15, 2023",
        status: "In Progress",
        subTasks: [
          {
            id: "ST2-1",
            name: "Draft Section A: Scope",
            assigned: "Marcus Thorne",
            duration: "1 Week",
            deadline: "Oct 30, 2023",
            status: "In Progress",
            subTasks: []
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-8 pt-24 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#f5914e] font-bold text-sm mb-6 hover:translate-x-[-4px] transition-transform uppercase tracking-wider"
        >
          <ChevronLeft size={20} /> BACK TO PROJECTS
        </button>

        {/* 1. PROJECT HEADER SECTION */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-200/40 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-black text-[#001529] tracking-tight">{projectInfo.title}</h1>
              <div className="flex gap-4 mt-2">
                <p className="text-[#f5914e] font-bold flex items-center gap-2 text-sm"><Briefcase size={16} /> {projectInfo.client}</p>
                <p className="text-gray-400 font-bold flex items-center gap-2 text-sm"><Clock size={16} /> {projectInfo.duration}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">
                <Edit3 size={16} /> Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#001529] text-white rounded-lg text-sm font-bold shadow-md hover:opacity-90">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Project Health</span>
              <span className="text-3xl font-black text-[#001529]">{projectInfo.overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#f5914e] to-[#fbbf24]" style={{ width: `${projectInfo.overallProgress}%` }} />
            </div>
          </div>
        </div>

        {/* 2. STAKEHOLDER DIRECTORY */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-[#001529] flex items-center gap-2">
              <Users className="text-[#f5914e]" size={24} /> Stakeholder Directory
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 text-center">Internal Team</h3>
              {projectInfo.internalTeam.map((m, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm hover:border-[#f5914e] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">{m.initial}</div>
                  <div>
                    <p className="text-sm font-bold text-[#001529] leading-tight">{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 text-center">External Leads</h3>
              {projectInfo.externalLeads.map((m, i) => (
                <div key={i} className={`bg-white p-3 rounded-xl border flex items-center gap-3 shadow-sm ${m.isAction ? 'border-dashed border-gray-300' : 'border-gray-100'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${m.isAction ? 'bg-gray-50 text-gray-400' : 'bg-[#001529] text-white'}`}>{m.initial}</div>
                  <div>
                    <p className={`text-sm font-bold leading-tight ${m.isAction ? 'text-gray-400' : 'text-[#001529]'}`}>{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 text-center">Client Team</h3>
              {projectInfo.clientTeam.map((m, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{m.initial}</div>
                  <div>
                    <p className="text-sm font-bold text-[#001529] leading-tight">{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. TASK LIST SECTION (Recursive) */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
            <h2 className="text-xl font-black text-[#001529] flex items-center gap-2">
              <LayoutList className="text-[#f5914e]" size={22} /> Project Tasks
            </h2>
            <button className="text-xs font-black text-[#f5914e] border border-[#f5914e] px-4 py-1.5 rounded-full hover:bg-[#f5914e] hover:text-white transition-all">
              + NEW TASK
            </button>
          </div>

          <div className="flex flex-col">
            {projectInfo.tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}