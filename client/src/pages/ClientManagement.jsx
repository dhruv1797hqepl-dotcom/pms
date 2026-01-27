import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import {
  Plus, MoreHorizontal, Briefcase, FileText,
  ArrowRight, X, Building2, Image as ImageIcon,
  Mail, Globe, MapPin, User, Lock, Search
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../api';

/* ───────────────────────── CREATE WORKSPACE MODAL ───────────────────────── */

const CreateWorkspaceModal = ({ isOpen, onClose, onClientCreated }) => {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company_name: '',
    contact_email: '',
    phone: '',
    website: '',
    address: '',
    logo: null,
  });

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Fixed: Change key to match backend 'logo'
      setFormData({ ...formData, logo: file });
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    // Match Django keys exactly
    data.append('username', formData.username);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('company_name', formData.company_name);
    data.append('contact_email', formData.contact_email);
    data.append('phone', formData.phone);
    data.append('website', formData.website);
    data.append('address', formData.address);
    if (formData.logo) data.append('logo', formData.logo);

    try {
      const token = localStorage.getItem('access_token');
      await api.post('clients/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      onClientCreated();

      try {
        const templateParams = {
          to_name: formData.username,        // Matches {{to_name}}
          user_email: formData.email,        // Matches {{user_email}}
          user_password: formData.password,  // Matches {{user_password}}
          project_name: formData.company_name
        };

        await emailjs.send(
          'service_oczgldo',
          'template_nl49nvu',
          templateParams,
          'GmA-Cd5MqIElqmX5b'
        );
      } catch (emailErr) {
        console.warn("Email notify failed:", emailErr);
      }

      onClose();
    } catch (error) {
      console.error("Backend Error:", error.response?.data);
      alert("Registration Error: " + JSON.stringify(error.response?.data || "Server unreachable"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="p-8 md:p-12">
          <div className="flex justify-between mb-8">
            <h2 className="text-3xl font-black uppercase italic">New <span className="text-[#f5914e]">Workspace</span></h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Account Login</p>
              <Input icon={User} label="Username" placeholder="admin_user" onChange={(v) => setFormData({ ...formData, username: v })} />
              <div className="grid grid-cols-2 gap-4">
                <Input icon={Mail} label="Email" placeholder="user@company.com" onChange={(v) => setFormData({ ...formData, email: v, contact_email: v })} />
                <Input icon={Lock} label="Password" placeholder="••••••••" type="password" onChange={(v) => setFormData({ ...formData, password: v })} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input icon={Building2} label="Company Name" placeholder="Acme Inc" onChange={(v) => setFormData({ ...formData, company_name: v })} />
              <Input icon={Briefcase} label="Phone Number" placeholder="+91..." onChange={(v) => setFormData({ ...formData, phone: v })} />
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-end">
              <Input icon={Globe} label="Website" placeholder="www.acme.com" onChange={(v) => setFormData({ ...formData, website: v })} />
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-4">Logo</label>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-[10px] p-3 bg-slate-50 rounded-xl cursor-pointer" />
                  {logoPreview && <img src={logoPreview} className="absolute right-2 top-2 w-6 h-6 rounded object-cover" alt="prev" />}
                </div>
              </div>
            </div>

            <Textarea label="Company Address" onChange={(v) => setFormData({ ...formData, address: v })} />

            <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-[#f5914e] transition-all">
              {loading ? 'Creating Workspace...' : 'Deploy Workspace'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── MAIN PAGE ───────────────────────── */

export default function ClientManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await api.get('clients/list/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = clients.filter(c =>
    c?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      <Navbar hideLogin />
      <CreateWorkspaceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onClientCreated={fetchClients} />

      <div className="pt-4 px-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between mb-16 gap-6 items-center">
          <h1 className="text-5xl font-black uppercase italic">Client <span className="text-[#f5914e]">Management</span></h1>
          <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase flex items-center gap-3 shadow-xl hover:bg-[#f5914e] transition-colors">
            <Plus size={18} /> Create Workspace
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 font-black uppercase text-slate-300 animate-pulse">Syncing...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} data={client} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── HELPERS ───────────────────────── */

const ClientCard = ({ data }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-4xl p-8 border border-slate-100 hover:shadow-2xl transition-all group overflow-hidden">
      <div className="flex justify-between mb-8">
        <div className="flex gap-4 items-center">
          {data?.logo ? (
            <img src={data.logo} className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm" alt="logo" />
          ) : (
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-[#f5914e] font-black text-xl">
              {data?.company_name?.[0] || 'C'}
            </div>
          )}
          <div>
            <h3 className="font-black text-xl text-slate-900 leading-tight">{data?.company_name || 'Unnamed Client'}</h3>
            <p className="text-[10px] text-slate-400 font-bold">{data?.contact_email || data?.email}</p>
          </div>
        </div>
        <MoreHorizontal className="text-slate-300 cursor-pointer" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <MiniCard icon={Briefcase} label="Phone" value={data?.phone || "N/A"} />
        {/* Added clickable website link */}
        <div className="bg-slate-50 p-3 rounded-2xl">
          <Globe size={14} className="text-[#f5914e] mb-1" />
          <p className="text-[8px] uppercase font-bold text-slate-400">Website</p>
          {data?.website ? (
            <a
              href={`https://${data.website.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-black text-slate-900 hover:text-[#f5914e] underline underline-offset-2"
            >
              Visit Site
            </a>
          ) : (
            <p className="text-[10px] font-black text-slate-900">N/A</p>
          )}
        </div>
      </div>

      <div className="bg-slate-50/50 p-4 rounded-2xl mb-6 flex gap-3 items-start border border-slate-100/50">
        <MapPin size={14} className="text-slate-300 mt-1 shrink-0" />
        <div>
          <p className="text-[8px] uppercase font-bold text-slate-400">Address</p>
          <p className="text-[10px] font-bold text-slate-600 line-clamp-1">{data?.address || "No address provided"}</p>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-50 pt-6">
        <span className="text-[10px] uppercase text-slate-400 font-bold">Client ID: #{data?.id}</span>
        <button onClick={() => navigate(`/clients/${data?.id}`)} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-[#f5914e] transition-all shadow-md active:scale-95">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

const Input = ({ icon: Icon, label, placeholder, onChange, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[9px] uppercase font-black text-slate-400 ml-4">{label}</label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
      <input
        required type={type}
        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:border-[#f5914e] outline-none transition-all"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

const Textarea = ({ label, onChange }) => (
  <div className="space-y-1">
    <label className="text-[9px] uppercase font-black text-slate-400 ml-4">{label}</label>
    <textarea
      rows="2"
      className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:border-[#f5914e] outline-none"
      onChange={(e) => onChange(e.target.value)}
      placeholder="Full office address..."
    />
  </div>
);

const MiniCard = ({ icon: Icon, label, value }) => (
  <div className="bg-slate-50 p-3 rounded-2xl">
    <Icon size={14} className="text-[#f5914e] mb-1" />
    <p className="text-[8px] uppercase font-bold text-slate-400">{label}</p>
    <p className="text-[10px] font-black text-slate-900 truncate">{value}</p>
  </div>
);