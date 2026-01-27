import React, { useState } from 'react';
import { UserPlus, Mail, Trash2, ShieldCheck, Search } from 'lucide-react';
import AddEmployeeModal from './AddEmployeeModal';

const EmployeeList = ({ project }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock Team Data
  const [employees, setEmployees] = useState([
    { id: 1, name: "Rahul Sharma", email: "rahul@hqepl.com", role: "Project Lead", joined: "Oct 2025" },
    { id: 2, name: "Priya Patel", email: "priya@hqepl.com", role: "Senior Consultant", joined: "Nov 2025" },
    { id: 3, name: "Kevin Vora", email: "kevin@hqepl.com", role: "Quality Analyst", joined: "Dec 2025" },
  ]);

  const handleAddEmployee = (newName) => {
    const newEntry = {
      id: Date.now(),
      name: newName,
      email: `${newName.toLowerCase().replace(" ", ".")}@hqepl.com`,
      role: "Team Member",
      joined: "Jan 2026"
    };
    setEmployees([...employees, newEntry]);
  };

  const removeEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.4em] text-[#F58A4B] uppercase">
            Project Team: {project?.title || "Current Project"}
          </span>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mt-2">
            Team Members
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search members..."
              className="pl-12 pr-6 py-3 bg-slate-50 border-2 border-slate-200 rounded-full text-xs outline-none focus:border-[#F58A4B] w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#F58A4B] text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-orange-100 flex items-center gap-3"
          >
            <UserPlus size={16} /> Add Member
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b-2 border-slate-100">
              <th className="p-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
              <th className="p-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designation</th>
              <th className="p-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onboarded</th>
              <th className="p-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase())).map((emp) => (
              <tr key={emp.id} className="group hover:bg-slate-50 transition-colors">
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-xs">
                      {emp.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 tracking-tight">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Mail size={10} /> {emp.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#F58A4B]" />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{emp.role}</span>
                  </div>
                </td>
                <td className="p-8 text-xs text-slate-400 font-bold">{emp.joined}</td>
                <td className="p-8 text-right">
                  <button 
                    onClick={() => removeEmployee(emp.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {employees.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No team members assigned to this project.</p>
          </div>
        )}
      </div>

      {/* Integration with your Modal */}
      {isModalOpen && (
        <AddEmployeeModal 
          onClose={() => setIsModalOpen(false)} 
          onAdd={handleAddEmployee} 
        />
      )}
    </div>
  );
};

export default EmployeeList;