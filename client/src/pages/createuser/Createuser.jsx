import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Navbar from '../../components/Navbar';
import api from '../../api';
import { 
  UserPlus, Mail, Lock, User, 
  Shield, ArrowLeft, Send, Loader2 
} from 'lucide-react';

const CreateUser = () => {
  const navigate = useNavigate();
  const form = useRef();
  const [loading, setLoading] = useState(false);
  
  // State to manage form inputs
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Employee'
  });

  const handleCreateAndEmail = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // 1️⃣ CREATE USER IN BACKEND
    const res = await api.post("admin/createuser/", {
      username: formData.username,   // 👈 using username instead of full name
      email: formData.email,
      password: formData.password,
      role: formData.role.toUpperCase(), // EMPLOYEE / SGM / ADMIN
    });

    // 2️⃣ SEND EMAIL AFTER SUCCESSFUL CREATION
    const SERVICE_ID = 'service_oczgldo';
    const TEMPLATE_ID = 'template_e5223pj';
    const PUBLIC_KEY = 'GmA-Cd5MqIElqmX5b';

    const templateParams = {
      to_name: formData.fullName,     // username shown in email
      user_email: formData.email,
      user_password: formData.password,
      user_role: formData.role,
    };

    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    alert(`User ${res.data.username} created & credentials emailed`);
    navigate('/admin/');

  } catch (err) {
    console.error(err);
    alert(
      err.response?.data?.detail ||
      err.response?.data?.error ||
      "User creation failed"
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      {/* Navbar with hideLogin prop to keep internal view clean */}
      <Navbar hideLogin={true} />

      <main className="max-w-3xl mx-auto px-8 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Navigation Header */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-[#F58A4B] font-black text-[10px] uppercase tracking-[0.3em] mb-8 transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Admin Directory
        </button>

        {/* Form Container */}
        <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-slate-200/60 relative overflow-hidden">
          
          {/* Subtle Decorative Background Element */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            {/* Header Section */}
            <div className="flex items-center gap-6 mb-12 border-b border-slate-50 pb-8">
              <div className="p-5 bg-slate-900 text-[#F58A4B] rounded-3xl shadow-lg">
                <UserPlus size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                  Onboard <span className="text-[#F58A4B]">User</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                  Automated Credential Dispatch via EmailJS
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateAndEmail} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name Input */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-5">Username</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Johnathan Doe"
                      className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#F58A4B] focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-5">Assign Account Role</label>
                  <div className="relative">
                    <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select 
                      className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#F58A4B] focus:bg-white outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="Employee">Employee Access</option>
                      <option value="SGM">SGM Access</option>
                      <option value="Hqepl">Hqepl Access</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-5">Corporate Email Identity</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email"
                    required
                    placeholder="user@hqepl.com"
                    className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#F58A4B] focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-5">Temporary Access Password</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text"
                    required
                    placeholder="Set initial password"
                    className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-[#F58A4B] focus:bg-white outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              {/* CTA Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 hover:bg-black transition-all shadow-xl shadow-slate-200 mt-10 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>Initializing System... <Loader2 size={18} className="animate-spin text-[#F58A4B]" /></>
                ) : (
                  <>Finalize Onboarding & Send Email <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                )}
              </button>

            </form>
          </div>
        </div>
        
        {/* Footer Note */}
        <p className="text-center mt-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-loose">
          All credentials will be dispatched using the HQEPL Corporate Template <br />
          Data encryption active for secure onboarding
        </p>
      </main>
    </div>
  );
};

export default CreateUser;