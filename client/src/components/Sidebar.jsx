import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Briefcase, Target, Box, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    {
      label: "Dashboard",
      icon: <LayoutGrid size={20} />,
      path: "/employeedashboard",
      color: "hover:text-blue-600"
    },
    {
      label: "Project / Client",
      icon: <Briefcase size={20} />,
      path: "/clients",
      color: "hover:text-purple-600"
    },
    {
      label: "KPI Performance",
      icon: <Target size={20} />,
      path: "/weekly-score",
      color: "hover:text-emerald-600"
    },
    {
      label: "DDTME Approval",
      icon: <Box size={20} />,
      path: "/ddtme",
      color: "hover:text-orange-600"
    },
    {
      label: "Team Members",
      icon: <Users size={20} />,
      path: "/staff",
      color: "hover:text-indigo-600"
    }
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`relative h-full bg-blue-900 text-white shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center p-4 border-b border-white/50">
          <img
            src="/HqeplLOGO.png"
            alt="HQEPL Logo"
            className={`object-contain ${
              isOpen ? 'h-12' : 'h-8'
            } transition-all duration-300`}
          />
        </div>

        {/* Toggle Button */}
        <div className="p-4 flex justify-end">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? (
              <ChevronLeft size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-4 space-y-2 flex-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                hoveredItem === index
                  ? 'bg-white/15 backdrop-blur'
                  : 'hover:bg-white/10'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <span className={`flex-shrink-0 ${item.color}`}>
                {item.icon}
              </span>
              {isOpen && (
                <span className="text-sm font-medium text-white/90">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout Button - Fixed at Bottom */}
        <div className="px-4 pb-4">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 bg-white/10 hover:bg-red-500/20 text-white/90 hover:text-red-100`}
            title={!isOpen ? 'Logout' : ''}
          >
            <span className="flex-shrink-0">
              <LogOut size={20} />
            </span>
            {isOpen && (
              <span className="text-sm font-medium">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      </>
    );
  };

export default Sidebar;
