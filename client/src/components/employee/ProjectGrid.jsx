import React from 'react';
import { Clock, Users, ExternalLink } from 'lucide-react';

const ProjectGrid = () => {
  const assignedProjects = [
    {
      id: 1,
      name: "E-Commerce App",
      client: "HQEPL Corp",
      status: "In Progress",
      progress: 75,
      teamCount: 4,
      dueDate: "Oct 24",
      priority: "High"
    },
    {
      id: 2,
      name: "Cloud Migration",
      client: "SGM Logistics",
      status: "Review",
      progress: 90,
      teamCount: 2,
      dueDate: "Oct 28",
      priority: "Medium"
    },
    {
      id: 3,
      name: "Security Audit",
      client: "Global Tech",
      status: "Planning",
      progress: 15,
      teamCount: 5,
      dueDate: "Nov 15",
      priority: "Low"
    }
  ];

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Assigned Projects</h3>
        <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
          View All Projects <ExternalLink size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignedProjects.map((project) => (
          <div key={project.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                project.priority === 'High' ? 'bg-red-100 text-red-600' : 
                project.priority === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
              }`}>
                {project.priority} Priority
              </span>
              <span className="text-gray-400"><Clock size={16} /></span>
            </div>
            
            <h4 className="font-bold text-gray-800 text-lg">{project.name}</h4>
            <p className="text-sm text-gray-500 mb-4">Client: {project.client}</p>

            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 font-medium">Completion</span>
                <span className="text-blue-600 font-bold">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Users size={14} />
                <span>{project.teamCount} members</span>
              </div>
              <span className="text-xs font-semibold text-gray-400">Due {project.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectGrid;