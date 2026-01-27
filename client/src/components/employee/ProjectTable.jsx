const ProjectTable = () => {
  const data = [
    { project: 'Web Redesign', client: 'HQEPL Corp', deadline: 'Dec 2024', status: 'Working On' },
    { project: 'Mobile App', client: 'SGM Logistics', deadline: 'Jan 2025', status: 'On Hold' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="font-bold text-gray-700">Active Projects & Clients</h3>
      </div>
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-600 text-sm">
          <tr>
            <th className="p-4">Project Name</th>
            <th className="p-4">Client</th>
            <th className="p-4">Timeline</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
              <td className="p-4 font-medium">{row.project}</td>
              <td className="p-4">{row.client}</td>
              <td className="p-4 text-gray-500">{row.deadline}</td>
              <td className="p-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;