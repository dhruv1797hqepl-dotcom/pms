# Performance Analytics - Customization & Enhancement Guide

## 🎨 Customization Options

### 1. Color Customization

**Current Colors** (in PerformanceAnalytics.jsx):
```javascript
const EMPLOYEE_COLORS = [
  '#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ec4899',
  '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'
];
```

**To Change Colors**:
1. Edit the `EMPLOYEE_COLORS` array
2. Add more colors if more than 10 employees need unique colors
3. Hex values or Recharts color names work

**Example - Dark Theme Colors**:
```javascript
const EMPLOYEE_COLORS = [
  '#60a5fa', '#fb923c', '#34d399', '#c084fc', '#f472b6',
  '#2dd4bf', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee'
];
```

### 2. Chart Dimensions

**Overall Chart Height** (line 93):
```javascript
<ResponsiveContainer width="100%" height={320}>
```
Change `320` to desired height in pixels. Larger = more space for details.

**Detail Charts Height** (lines 246, 275):
```javascript
<ResponsiveContainer width="100%" height={280}>
```
Adjust for detail view charts independently.

### 3. Animation Settings

**Toggle Animations** (multiple locations):
```javascript
// In LineChart
isAnimationActive={true}          // Set to false to disable
animationDuration={500}            // Change duration in milliseconds

// In BarChart
animationDuration={500}            // Same approach
```

### 4. Tooltip Styling

**Current Dark Tooltip** (lines 116-120):
```javascript
contentStyle={{
  backgroundColor: '#1e293b',      // Dark slate
  border: 'none',
  borderRadius: '8px',
  padding: '12px'
}}
```

**Alternative Styles**:
```javascript
// Light tooltip
contentStyle={{
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  padding: '12px'
}}

// Blue accent
contentStyle={{
  backgroundColor: '#1e40af',
  border: 'none',
  borderRadius: '8px',
  padding: '12px'
}}
```

### 5. Filter Button Styling

**Modify Button Appearance** (lines 99-110):
```javascript
// Current: Active = blue background with white text
// Inactive = light gray background

// To use outline style instead:
className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
  metricFilter === filter
    ? 'bg-transparent border-2 border-blue-600 text-blue-600'  // Outline
    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
}`}
```

### 6. Metric Names

**Customize Label Text** (throughout component):
```javascript
// Change metric names
// Find and replace:
'ATS Average' → 'On-Time Score'
'OTC Average' → 'Completion Rate'
'Your ATS' → 'Your Score'
'Team ATS Avg' → 'Team Average'
```

---

## 🚀 Enhancement Opportunities

### Enhancement 1: Export Chart as Image

```javascript
// Add in PerformanceAnalytics.jsx
import html2canvas from 'html2canvas';

const exportChart = async (chartRef) => {
  const canvas = await html2canvas(chartRef.current);
  const link = document.createElement('a');
  link.href = canvas.toDataURL();
  link.download = `performance-chart-${new Date().toISOString()}.png`;
  link.click();
};

// Add export button in JSX
<button onClick={() => exportChart(chartRef)} className="...">
  📥 Export Chart
</button>
```

### Enhancement 2: Comparison Mode (Employee vs Employee)

```javascript
const [comparisonEmployees, setComparisonEmployees] = useState([]);

// Add checkbox next to employee selector
<input 
  type="checkbox" 
  onChange={(e) => {
    if (e.target.checked) {
      setComparisonEmployees([...comparisonEmployees, emp.id]);
    }
  }} 
/>

// Create comparison chart rendering both employees
```

### Enhancement 3: Date Range Picker

```javascript
import { DatePicker } from 'react-datepicker';

const [dateRange, setDateRange] = useState({
  start: new Date(),
  end: new Date()
});

// Add date picker UI and filter data by date range
```

### Enhancement 4: Trend Analysis

```javascript
const calculateTrend = (data) => {
  if (data.length < 2) return 'stable';
  const recent = parseFloat(data[data.length - 1]);
  const previous = parseFloat(data[data.length - 2]);
  
  if (recent > previous) return '📈 Improving';
  if (recent < previous) return '📉 Declining';
  return '➡️ Stable';
};

// Display trend badge near employee name
<span className="text-xs font-semibold text-green-600">
  {calculateTrend(employeeData)}
</span>
```

### Enhancement 5: Ranking System

```javascript
const getRanking = (teamData) => {
  return teamData
    .filter(emp => emp.isEmployee)
    .sort((a, b) => {
      const aScore = parseFloat(a.overall.ats) || 0;
      const bScore = parseFloat(b.overall.ats) || 0;
      return bScore - aScore;
    })
    .map((emp, idx) => ({ ...emp, rank: idx + 1 }));
};

// Display rank in employee selector
<span className="text-xs font-bold text-amber-600">#{rank}</span>
```

### Enhancement 6: Performance Alerts

```javascript
const performanceAlerts = useMemo(() => {
  return teamData
    .filter(emp => {
      const score = parseFloat(emp.overall.ats);
      return score < 60; // Alert if below 60%
    })
    .map(emp => ({
      employee: emp.name,
      severity: 'high',
      message: `Performance below 60%`
    }));
}, [teamData]);

// Display alerts at top of component
```

### Enhancement 7: Performance Targets

```javascript
const TARGET_ATS = 85;
const TARGET_OTC = 90;

// Add target lines to charts
<ReferenceLine 
  y={TARGET_ATS} 
  stroke="#22c55e" 
  strokeDasharray="5 5"
  label={{ value: `Target: ${TARGET_ATS}%`, position: 'insideRight' }}
/>
```

### Enhancement 8: Performance Predictions

```javascript
const predictTrend = (historicalData) => {
  // Simple linear regression
  if (historicalData.length < 2) return null;
  
  const values = historicalData.map(d => parseFloat(d) || 0);
  const avgIncrease = (values[values.length - 1] - values[0]) / values.length;
  
  return {
    trend: avgIncrease > 0 ? 'up' : 'down',
    predictedNext: (values[values.length - 1] + avgIncrease).toFixed(1)
  };
};
```

### Enhancement 9: Filter by Team/Department

```javascript
const [selectedTeam, setSelectedTeam] = useState('all');

const filteredByTeam = useMemo(() => {
  if (selectedTeam === 'all') return teamData;
  return teamData.filter(emp => emp.team === selectedTeam);
}, [teamData, selectedTeam]);

// Add team selector dropdown
```

### Enhancement 10: Benchmark Comparisons

```javascript
const benchmarkData = {
  industry_avg: 78.5,
  company_avg: 82.3,
  department_avg: 85.1
};

// Display comparison cards
<div className="grid grid-cols-3 gap-4">
  <BenchmarkCard label="Industry Avg" value={benchmarkData.industry_avg} />
  <BenchmarkCard label="Company Avg" value={benchmarkData.company_avg} />
  <BenchmarkCard label="Team Avg" value={teamAverage} />
</div>
```

---

## 🔧 Code Organization Tips

### 1. Separate Calculation Logic
```javascript
// Create utils/chartCalculations.js
export const calculateOverallChartData = (teamData, displayPeriods, metricFilter) => {
  // Move line 44-77 calculation logic here
};

export const calculateEmployeeDetail = (employee, teamData, displayPeriods) => {
  // Move line 79-116 calculation logic here
};

// Then in component:
import { calculateOverallChartData, calculateEmployeeDetail } from '../utils/chartCalculations';
```

### 2. Extract Chart Components
```javascript
// Create components/PerformanceChart.jsx
export const OverallPerformanceChart = ({ data, metricFilter }) => {
  return <LineChart>...</LineChart>;
};

// Create components/EmployeeDetailChart.jsx
export const EmployeeVsTeamChart = ({ data }) => {
  return <LineChart>...</LineChart>;
};

export const WeeklyMetricsChart = ({ data }) => {
  return <BarChart>...</BarChart>;
};
```

### 3. Create Constants File
```javascript
// Create constants/analytics.js
export const EMPLOYEE_COLORS = [...];
export const CHART_HEIGHT = 320;
export const DETAIL_CHART_HEIGHT = 280;
export const ANIMATION_DURATION = 500;
export const TARGET_METRICS = {
  ATS: 85,
  OTC: 90
};
```

---

## 🧪 Testing Enhancements

### Test Cases to Add
```javascript
// __tests__/PerformanceAnalytics.test.jsx
describe('PerformanceAnalytics', () => {
  test('renders with no data', () => {});
  test('filters work correctly', () => {});
  test('employee selection expands detail', () => {});
  test('calculations are accurate', () => {});
  test('responsive classes apply', () => {});
  test('tooltips show on hover', () => {});
});
```

---

## 📊 Performance Optimization Tips

### 1. Lazy Load Detail View
```javascript
const DetailCharts = React.lazy(() => import('./DetailCharts'));

// In JSX:
<Suspense fallback={<LoadingSpinner />}>
  {selectedEmployeeDetail && <DetailCharts data={...} />}
</Suspense>
```

### 2. Debounce Employee Selection
```javascript
import { debounce } from 'lodash';

const handleEmployeeSelect = debounce((empId) => {
  setSelectedEmployeeDetail(empId);
}, 300);
```

### 3. Virtual Scrolling for Many Employees
```javascript
import { FixedSizeList } from 'react-window';

// Render employee list with virtual scrolling
```

---

## 🎯 Recommended Next Steps

1. **Phase 1**: Deploy current version and gather user feedback
2. **Phase 2**: Add export functionality and date range picker
3. **Phase 3**: Implement trend analysis and performance alerts
4. **Phase 4**: Add team comparisons and benchmarks
5. **Phase 5**: Advanced analytics with predictions

---

**Remember**: Test thoroughly after any modifications, especially with different data sizes and user scenarios!
