import React from 'react';
import { 
  LayoutDashboard, 
  UserCircle, 
  Briefcase, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: true },
    { icon: <UserCircle size={20} />, label: 'My Profile', active: false },
    { icon: <Briefcase size={20} />, label: 'Projects', active: false },
    { icon: <Calendar size={20} />, label: 'Calendar', active: false },
    { icon: <BarChart3 size={20} />, label: 'Performance (KPI)', active: false },
  ];

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col text-white shadow-xl">
      {/* Brand / Logo Section */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold tracking-wider text-blue-400">
          PRO-MANAGE <span className="text-white text-xs block font-normal">Internal System</span>
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
              item.active 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Section: Settings & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <button className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;