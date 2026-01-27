const PlanningChart = () => {
  return (
    <div className="space-y-4">
      {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week) => (
        <div key={week}>
          <div className="flex justify-between text-sm mb-1">
            <span>{week} Progress</span>
            <span className="font-bold">70%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
      ))}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-xs text-yellow-800">
        <strong>Note:</strong> DDTME targets for this month are updated every Monday.
      </div>
    </div>
  );
};

export default PlanningChart;