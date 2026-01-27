const StatsCards = () => {
  const stats = [
    { label: 'Overall Performance', value: '85%', color: 'text-green-600' },
    { label: 'Active Projects', value: '4', color: 'text-blue-600' },
    { label: 'KPI Target', value: '92/100', color: 'text-purple-600' },
    { label: 'Tasks Pending', value: '12', color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase font-semibold">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;