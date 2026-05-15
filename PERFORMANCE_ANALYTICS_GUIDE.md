# Performance Analytics Section - Implementation Guide

## Overview
A responsive performance analytics dashboard component has been added to your WeeklyScore page. It provides visual insights into employee performance metrics using interactive charts and filters.

## Components Added

### 1. **PerformanceAnalytics Component** (`client/src/components/PerformanceAnalytics.jsx`)
Main analytics component with three key sections:

#### A. Overall Employees Performance Chart
- **Type**: Multi-line chart
- **X-axis**: Weeks (W1-W5) or time periods based on view mode
- **Y-axis**: Performance percentage (0-100%)
- **Features**:
  - Line for each metric (ATS/OTC/Both)
  - Smooth animations (500ms duration)
  - Interactive tooltips on hover
  - Responsive containers adapt to screen size
  - Color-coded metrics:
    - ATS: Sky blue (#0ea5e9)
    - OTC: Orange (#f97316)

#### B. Filter Controls
Three filter buttons for metric selection:
- **Both**: Shows both ATS and OTC average lines
- **ATS**: Shows only ATS (On-Time Score) average
- **OTC**: Shows only OTC (On-Time Completion) average

Default: **Both** (shows all employees' average performance)

#### C. Individual Employee Analytics
Expandable section for detailed employee analysis:

**Employee Selector**:
- Grid layout of employee cards
- Click to select/deselect for detailed view
- Shows employee name and overall ATS average
- Visual indicator when selected (blue border, light background)

**When Employee is Selected**:

1. **Employee vs Team Average Chart**
   - Type: Line chart
   - Shows employee's ATS trend vs team average
   - Dashed line for team average reference
   - Helps identify performance gaps

2. **Weekly ATS vs OTC Chart**
   - Type: Grouped bar chart
   - Displays weekly breakdown of ATS and OTC
   - Easy comparison between metrics
   - Color-coded bars (blue for ATS, orange for OTC)

3. **Summary Statistics**
   - 4-card stats layout
   - Displays:
     - Employee's Average ATS
     - Employee's Average OTC
     - Team Average ATS
     - Team Average OTC
   - Color-coded backgrounds for quick visual reference

## Features

✅ **Responsive Design**
- Mobile-first approach
- Adapts from 1-column (mobile) → 2-column (tablet) → Full layout (desktop)
- Charts resize automatically with container

✅ **Interactive Elements**
- Hover tooltips on all charts (dark background, readable font)
- Line/bar active states (dots/bars enlarge on hover)
- Smooth transitions between filter selections
- Click-to-expand employee details

✅ **Data Processing**
- Automatic averaging of team metrics
- Handles missing/invalid data (converts to 0)
- Calculates team averages for comparison
- Filters data by selected metric type

✅ **Animations**
- Smooth chart animations (500ms Recharts default)
- Transition states for button selections
- Hover effects on interactive elements

✅ **Accessibility**
- Semantic HTML structure
- Clear labels and legends
- High contrast color choices
- Keyboard-navigable buttons

## Data Structure

### Input Data (from teamData)
```javascript
{
  id: employee_id,
  name: "Employee Name",
  isEmployee: true,
  overall: { ats: "85.5%", otc: "92.3%" },
  periodData: [
    { ats: "88.2%", otc: "95.1%" },  // W1
    { ats: "85.5%", otc: "92.3%" },  // W2
    // ... more weeks
  ]
}
```

### Display Periods
```javascript
displayPeriods = [
  {
    label: "W1",
    subLabel: "1-7 Jan",
    startDate: Date,
    endDate: Date
  },
  // ... more periods
]
```

## Usage in WeeklyScore.jsx

The component is integrated in the main dashboard:

```jsx
<PerformanceAnalytics 
  teamData={teamData} 
  displayPeriods={displayPeriods} 
/>
```

**Placement**: 
- Located between FILTERS section and TABLE section
- Displays before the detailed performance table
- Shows high-level analytics overview

## Styling Details

### Color Palette
- **ATS**: Sky Blue (#0ea5e9)
- **OTC**: Orange (#f97316)
- **Team Avg**: Slate (#94a3b8)
- **Success**: Green (#22c55e)
- **Accent**: Blue (#0ea5e9)

### Tailwind Classes Used
- **Spacing**: `p-4 md:p-6`, `gap-4`, `space-y-6`
- **Typography**: `text-lg font-bold`, `text-xs uppercase`
- **Borders**: `border border-slate-200`, `rounded-xl`
- **Effects**: `shadow-sm`, `hover:bg-slate-100`, `transition-all`

### Responsive Breakpoints
- `md`: Medium (768px) - tablet
- `lg`: Large (1024px) - desktop

## Mobile Responsiveness

**Mobile (< 768px)**:
- Single column layout for analytics section
- Stacked detail view (Employee vs Team above ATS vs OTC)
- Full-width filter buttons
- Larger touch targets

**Tablet (768px - 1024px)**:
- 2-column layout for detail charts
- Flexible grid for employee selector

**Desktop (> 1024px)**:
- Full side-by-side layout
- 3-column employee selector grid
- Optimized spacing

## Chart Configuration

### Recharts Props
- **ResponsiveContainer**: width="100%" height={320} (detail view)
- **Margins**: `{ top: 5, right: 30, left: 0, bottom: 5 }`
- **Grid**: Dashed style with light color
- **Animation**: 500ms duration, smooth easing

### Tooltip Styling
```javascript
contentStyle: {
  backgroundColor: '#1e293b',    // dark slate
  border: 'none',
  borderRadius: '8px',
  padding: '12px'
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires React 19.2.0+
- Tested with:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

## Performance Considerations

- **Memoization**: All chart data uses `useMemo` for optimization
- **Lazy Rendering**: Charts only render when needed
- **Re-render Optimization**: Dependencies properly configured
- **Data Handling**: Gracefully handles empty/invalid data

## Future Enhancements

Potential improvements:
- Export chart as PNG/PDF
- Drill-down analytics by project
- Time range selector (custom dates)
- Comparison mode (employee vs employee)
- Performance trend predictions
- Historical data retention
- Custom metric definitions

## Troubleshooting

**Charts Not Showing**:
- Verify `teamData` has employees with `isEmployee: true`
- Check that `periodData` arrays are populated
- Ensure Recharts is installed: `npm ls recharts`

**Responsive Issues**:
- Check viewport meta tag in HTML
- Verify Tailwind CSS is loaded
- Clear browser cache

**Animation Delays**:
- Normal behavior (500ms Recharts default)
- Adjust in component if needed: change `animationDuration={500}`

**Data Not Updating**:
- Check that `teamData` updates when period changes
- Verify `displayPeriods` calculation
- Check console for data fetch errors

## File Changes Summary

### New Files
- `/client/src/components/PerformanceAnalytics.jsx` (300+ lines)

### Modified Files
- `/client/src/pages/WeeklyScore.jsx`
  - Added import for PerformanceAnalytics
  - Added component in render between filters and table

### No Breaking Changes
- Fully backward compatible
- Existing table functionality unchanged
- All existing features preserved

## Dependencies
- React 19.2.0
- Recharts 3.6.0
- Tailwind CSS 4.1.18
- lucide-react 0.562.0
