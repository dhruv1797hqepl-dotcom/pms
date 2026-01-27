import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
  Filter, BarChart3, Plus, User, LayoutGrid, 
  CheckCircle, Clock, AlertCircle, TrendingUp 
} from 'lucide-react';

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  // Mock data for the Pie Chart matching the brand theme
  const chartData = [
    { name: "On Time", value: 40, color: "#22c55e" },    // Green
    { name: "In Progress", value: 30, color: "#3b82f6" }, // Blue
    { name: "Delayed", value: 20, color: "#facc15" },    // Yellow
    { name: "Overdue", value: 10, color: "#ef4444" },    // Red
  ];

  return (
    <div className="min-h-screen bg-slate-50 antialiased">
      {/* 1. Navbar: hideLogin set to true for internal views */}
      <Navbar hideLogin={true} />

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-10 py-14 grid grid-cols-12 gap-10">

        {/* PIE CHART CARD - Occupies 5 columns */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-black text-slate-900 tracking-tighter text-xl uppercase italic">
              Task Distribution
            </h2>
            <div className="p-2 bg-slate-50 rounded-lg text-[#F58A4B]">
              <BarChart3 size={20} />
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={8}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KPI CARDS GRID - Occupies 7 columns */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard title="Total Task" value="12" color="border-indigo-500" icon={<LayoutGrid size={22}/>} />
          <KPICard title="On Time Task" value="05" color="border-green-500" icon={<CheckCircle size={22}/>} />
          <KPICard title="Delay Completion" value="03" color="border-yellow-400" icon={<Clock size={22}/>} />
          <KPICard title="In Progress" value="02" color="border-blue-500" icon={<TrendingUp size={22}/>} />
          <KPICard title="Over Due" value="02" color="border-red-500" icon={<AlertCircle size={22}/>} />
          <KPICard title="Percentage" value="84%" color="border-purple-500" icon={<User size={22}/>} />
        </div>
      </main>

      {/* ===== ACTION BAR ===== */}
      <div className="max-w-7xl mx-auto px-10 pb-20 space-y-6">
        <div className="flex flex-wrap justify-center gap-6">
          <ActionButton label="Filter View" icon={<Filter size={16} />} />
          <ActionButton label="Financial MS" icon={<BarChart3 size={16} />} />
          <ActionButton label="Assign New Task" icon={<Plus size={16} />} primary />
        </div>

        <div className="flex flex-col gap-4">
          <WideButton label="Active Task Sheet" count="12" />
          <WideButton label="Completed Tasks Archive" count="48" />
        </div>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const KPICard = ({ title, value, color, icon }) => (
  <div className={`bg-white rounded-2xl shadow-sm p-8 border-l-[6px] ${color} border-2 border-y-slate-100 border-r-slate-100 flex items-center justify-between group hover:shadow-md transition-all`}>
    <div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</span>
      <h2 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{value}</h2>
    </div>
    <div className="text-slate-200 group-hover:text-slate-900 transition-colors">
      {icon}
    </div>
  </div>
);

const ActionButton = ({ label, icon, primary }) => (
  <button className={`flex items-center gap-3 px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${
    primary 
    ? "bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-200" 
    : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"
  }`}>
    {icon} {label}
  </button>
);

const WideButton = ({ label, count }) => (
  <button className="w-full flex justify-between items-center bg-white border-2 border-slate-100 p-6 rounded-2xl hover:border-[#F58A4B] transition-all group">
    <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{label}</span>
    <span className="bg-slate-50 px-5 py-1.5 rounded-full text-[10px] font-bold text-slate-400 group-hover:bg-[#F58A4B] group-hover:text-white transition-colors">
      {count} Items
    </span>
  </button>
);

export default EmployeeDashboard;