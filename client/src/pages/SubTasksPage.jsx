import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, CheckCircle2, Circle, 
  Clock, Filter, X 
} from 'lucide-react';

// Task Modal Component
const TaskModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001529]/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-black text-[#001529]">ADD NEW <span className="text-[#f5914e]">TASK</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#f5914e] transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Task Title</label>
            <input 
              type="text" 
              placeholder="Enter task name..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#f5914e] outline-none transition-all font-medium text-[#001529]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Priority</label>
              <select className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#f5914e] outline-none transition-all font-medium text-[#001529] appearance-none bg-white">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Deadline</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-[#f5914e] outline-none transition-all font-medium text-[#001529]"
              />
            </div>
          </div>

          <button 
            type="button"
            className="w-full py-4 bg-gradient-to-r from-[#f5914e] to-[#fbbf24] text-white font-black rounded-2xl shadow-lg shadow-orange-200 hover:scale-[1.02] transition-all"
          >
            CREATE TASK
          </button>
        </form>
      </div>
    </div>
  );
};

export default function SubTasksPage() {
  const { clientName, projectName } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ... (Previous taskData and TaskCard components remain the same)

  return (
    <div className="min-h-screen bg-[#fcfcfc] px-8 pt-24 pb-12">
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <button 
          onClick={() => navigate(`/client/${clientName}/${projectName}`)}
          className="flex items-center gap-2 text-[#f5914e] font-bold text-sm mb-6 hover:translate-x-[-4px] transition-transform uppercase tracking-wider"
        >
          <ChevronLeft size={20} /> BACK TO {decodeURIComponent(projectName)}
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-[#001529] mb-2 uppercase tracking-tight">
              Project <span className="text-[#f5914e]">Sub-Tasks</span>
            </h1>
            <p className="text-gray-500 font-medium">Managing task execution for {decodeURIComponent(projectName)}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 border-2 border-gray-100 bg-white rounded-full text-sm font-bold text-gray-600 flex items-center gap-2 hover:border-[#f5914e] transition-all">
              <Filter size={16} /> Filter
            </button>
            {/* Click Handler to Open Modal */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-2.5 bg-[#001529] text-white rounded-full text-sm font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={3} /> ADD TASK
            </button>
          </div>
        </div>

        {/* ... (Kanban Board Columns) */}
      </div>
    </div>
  );
}