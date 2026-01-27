import React from 'react';
import { Briefcase, ChevronRight, Plus } from 'lucide-react';

const ClientList = ({ onSelectClient }) => {
  // Mock Data for the Frontend
  const clients = [
    {
      id: 1,
      name: "Reliance Industries",
      location: "Mumbai, India",
      activeProjects: 4,
      category: "Manufacturing"
    },
    {
      id: 2,
      name: "Tata Motors",
      location: "Pune, India",
      activeProjects: 2,
      category: "Infrastructure"
    },
    {
      id: 3,
      name: "Adani Group",
      location: "Ahmedabad, India",
      activeProjects: 5,
      category: "Energy"
    }
  ];

  return (
    <div className="space-y-10">
      {/* Header with Add Client Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.4em] text-[#F58A4B] uppercase">
            Management Overview
          </span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mt-2">
            Client Directory
          </h2>
        </div>
        
        <button className="bg-slate-900 text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center gap-3 w-fit">
          <Plus size={16} /> Add New Client
        </button>
      </div>

      {/* Grid of Client Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map((client) => (
          <div 
            key={client.id}
            className="group relative bg-slate-50/50 border-2 border-slate-300 p-8 rounded-[2.5rem] transition-all duration-300 hover:bg-white hover:shadow-2xl hover:shadow-slate-200"
          >
            {/* Top Row: Category Badge */}
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl text-[#F58A4B] shadow-sm">
                <Briefcase size={24} />
              </div>
              <span className="text-[9px] font-black tracking-widest uppercase px-3 py-1 bg-slate-200 text-slate-600 rounded-full">
                {client.category}
              </span>
            </div>

            {/* Client Info */}
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {client.name}
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">
              {client.location}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mb-8 pt-6 border-t border-slate-200">
              <div>
                <p className="text-2xl font-black text-slate-900">{client.activeProjects}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Projects</p>
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={() => onSelectClient(client)}
              className="w-full py-4 bg-white border-2 border-slate-300 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 flex items-center justify-center gap-2 group-hover:bg-[#F58A4B] group-hover:border-[#F58A4B] group-hover:text-white transition-all"
            >
              View Projects <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientList;