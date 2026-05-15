import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { ChevronDown, X } from 'lucide-react';

// Color palette for multiple employees
const EMPLOYEE_COLORS = [
  '#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ec4899',
  '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'
];

const getEmployeeColor = (index) => EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length];

const PerformanceAnalytics = ({ teamData, displayPeriods }) => {
  const [metricFilter, setMetricFilter] = useState('all'); // 'all', 'ats', 'otc'
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  // Transform data for overall performance chart
  const overallChartData = useMemo(() => {
    if (!teamData.length) return [];

    // Get all employees with their data
    const employeeList = teamData.filter(item => item.isEmployee);
    
    return displayPeriods.map((period, idx) => {
      const dataPoint = { period: period.label, periodIdx: idx };

      if (metricFilter === 'ats' || metricFilter === 'all') {
        const atsValues = employeeList
          .map(emp => {
            const val = parseFloat(emp.periodData[idx]?.ats || '0');
            return isNaN(val) ? 0 : val;
          })
          .filter(v => v > 0);
        dataPoint.atsAvg = atsValues.length ? (atsValues.reduce((a, b) => a + b) / atsValues.length).toFixed(1) : 0;
      }

      if (metricFilter === 'otc' || metricFilter === 'all') {
        const otcValues = employeeList
          .map(emp => {
            const val = parseFloat(emp.periodData[idx]?.otc || '0');
            return isNaN(val) ? 0 : val;
          })
          .filter(v => v > 0);
        dataPoint.otcAvg = otcValues.length ? (otcValues.reduce((a, b) => a + b) / otcValues.length).toFixed(1) : 0;
      }

      // Add individual employee data
      employeeList.forEach((emp, empIdx) => {
        const atsVal = parseFloat(emp.periodData[idx]?.ats || '0');
        const otcVal = parseFloat(emp.periodData[idx]?.otc || '0');
        
        if (metricFilter === 'ats' || metricFilter === 'all') {
          dataPoint[`${emp.id}_ats`] = isNaN(atsVal) ? 0 : atsVal;
        }
        if (metricFilter === 'otc' || metricFilter === 'all') {
          dataPoint[`${emp.id}_otc`] = isNaN(otcVal) ? 0 : otcVal;
        }
      });

      return dataPoint;
    });
  }, [teamData, displayPeriods, metricFilter]);

  // Data for employee detail view
  const employeeDetailData = useMemo(() => {
    if (!selectedEmployeeDetail) return null;

    const employee = teamData.find(emp => emp.id === selectedEmployeeDetail);
    if (!employee) return null;

    // Get team averages for each period
    const employeeList = teamData.filter(item => item.isEmployee);

    const chartData = displayPeriods.map((period, idx) => {
      const empAts = parseFloat(employee.periodData[idx]?.ats || '0');
      const empOtc = parseFloat(employee.periodData[idx]?.otc || '0');

      // Calculate team averages
      const teamAtsValues = employeeList
        .map(emp => parseFloat(emp.periodData[idx]?.ats || '0'))
        .filter(v => !isNaN(v) && v > 0);
      const teamOtcValues = employeeList
        .map(emp => parseFloat(emp.periodData[idx]?.otc || '0'))
        .filter(v => !isNaN(v) && v > 0);

      return {
        period: period.label,
        empAts: isNaN(empAts) ? 0 : empAts,
        empOtc: isNaN(empOtc) ? 0 : empOtc,
        teamAts: teamAtsValues.length ? (teamAtsValues.reduce((a, b) => a + b) / teamAtsValues.length).toFixed(1) : 0,
        teamOtc: teamOtcValues.length ? (teamOtcValues.reduce((a, b) => a + b) / teamOtcValues.length).toFixed(1) : 0,
      };
    });

    return {
      employee,
      chartData
    };
  }, [selectedEmployeeDetail, teamData, displayPeriods]);

  const employeeOptions = useMemo(() => {
    return teamData.filter(item => item.isEmployee).sort((a, b) => a.name.localeCompare(b.name));
  }, [teamData]);

  const handleEmployeeToggle = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else if (prev.length < 5) {
        return [...prev, employeeId];
      }
      return prev;
    });
  };

  const toggleEmployeeDetail = (employeeId) => {
    setSelectedEmployeeDetail(selectedEmployeeDetail === employeeId ? null : employeeId);
  };

  if (!teamData.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance Chart */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Overall Employees Performance</h2>
              <p className="text-sm text-slate-500 mt-1">Weekly performance trends across the team</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {['all', 'ats', 'otc'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setMetricFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                    metricFilter === filter
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'all' ? 'Both' : filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {overallChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={overallChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="period" 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                  label={{ value: 'Performance %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => `${value}%`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '16px' }}
                  iconType="line"
                />
                
                {metricFilter === 'all' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="atsAvg"
                      stroke="#0ea5e9"
                      name="ATS Average"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                      animationDuration={500}
                    />
                    <Line
                      type="monotone"
                      dataKey="otcAvg"
                      stroke="#f97316"
                      name="OTC Average"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                      animationDuration={500}
                    />
                  </>
                )}
                
                {metricFilter === 'ats' && (
                  <Line
                    type="monotone"
                    dataKey="atsAvg"
                    stroke="#0ea5e9"
                    name="ATS Average"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                )}
                
                {metricFilter === 'otc' && (
                  <Line
                    type="monotone"
                    dataKey="otcAvg"
                    stroke="#f97316"
                    name="OTC Average"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={500}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Employee Selector */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Individual Employee Analytics</h3>
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {employeeOptions.map((emp, idx) => (
                <button
                  key={emp.id}
                  onClick={() => toggleEmployeeDetail(emp.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedEmployeeDetail === emp.id
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getEmployeeColor(idx) }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                      <p className="text-xs text-slate-500">
                        Avg: {emp.overall.ats}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedEmployeeDetail && employeeDetailData && (
          <div className="p-4 md:p-6 border-t border-slate-100">
            {/* Header with close button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  {employeeDetailData.employee.name} - Performance Details
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Comparing with team averages
                </p>
              </div>
              <button
                onClick={() => setSelectedEmployeeDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employee vs Team Average */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  Employee vs Team Average
                </h5>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={employeeDetailData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => `${value}%`}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="empAts"
                      stroke="#0ea5e9"
                      name="Your ATS"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="teamAts"
                      stroke="#94a3b8"
                      name="Team ATS Avg"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly ATS vs OTC */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  Weekly ATS vs OTC
                </h5>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={employeeDetailData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => `${value}%`}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="empAts"
                      fill="#0ea5e9"
                      name="ATS"
                      radius={[8, 8, 0, 0]}
                      animationDuration={500}
                    />
                    <Bar
                      dataKey="empOtc"
                      fill="#f97316"
                      name="OTC"
                      radius={[8, 8, 0, 0]}
                      animationDuration={500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200">
              {[
                {
                  label: 'Avg ATS',
                  value: employeeDetailData.employee.overall.ats,
                  color: 'blue'
                },
                {
                  label: 'Avg OTC',
                  value: employeeDetailData.employee.overall.otc,
                  color: 'orange'
                },
                {
                  label: 'Team ATS',
                  value: (
                    employeeDetailData.chartData
                      .map(d => parseFloat(d.teamAts))
                      .reduce((a, b) => a + b, 0) / employeeDetailData.chartData.length
                  ).toFixed(1) + '%',
                  color: 'slate'
                },
                {
                  label: 'Team OTC',
                  value: (
                    employeeDetailData.chartData
                      .map(d => parseFloat(d.teamOtc))
                      .reduce((a, b) => a + b, 0) / employeeDetailData.chartData.length
                  ).toFixed(1) + '%',
                  color: 'slate'
                }
              ].map((stat, idx) => {
                const colorMap = {
                  blue: 'bg-blue-50 text-blue-700 border-blue-200',
                  orange: 'bg-orange-50 text-orange-700 border-orange-200',
                  slate: 'bg-slate-100 text-slate-700 border-slate-200'
                };
                return (
                  <div key={idx} className={`p-3 rounded-lg border ${colorMap[stat.color]}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold mt-1">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
