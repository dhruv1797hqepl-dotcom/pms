import React, { useState } from 'react';
import { X, UserPlus, Shield } from 'lucide-react';

const AddEmployeeModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Team Member");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name, role); // Passing both name and role back to EmployeeList
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] border-2 border-slate-300 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F58A4B] rounded-lg">
              <UserPlus size={20} className="text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Add Member</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          
          {/* Name Input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
              Full Name
            </label>
            <div className="relative">
              <input 
                autoFocus
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#F58A4B] focus:bg-white outline-none transition-all font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
              Assign Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              {["Team Member", "Project Lead", "Consultant", "Quality Head"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 px-4 rounded-xl border-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    role === r 
                    ? "border-[#F58A4B] bg-orange-50 text-[#F58A4B]" 
                    : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-2 border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xl shadow-slate-200 hover:bg-black transition-all transform active:scale-95"
            >
              Confirm Addition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;