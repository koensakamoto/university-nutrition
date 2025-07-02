import React from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Mock data for the macro chart
const getDailyData = () => [
  { name: '15 Jun', protein: 102, carbs: 185, fat: 42, alcohol: 0, total: 1542 },
  { name: '16 Jun', protein: 94, carbs: 152, fat: 36, alcohol: 0, total: 1308 },
  { name: '17 Jun', protein: 0, carbs: 0, fat: 0, alcohol: 0, total: 0 },
  { name: '18 Jun', protein: 120, carbs: 210, fat: 55, alcohol: 12, total: 1878 },
  { name: '19 Jun', protein: 87, carbs: 143, fat: 38, alcohol: 0, total: 1254 },
  { name: '20 Jun', protein: 0, carbs: 0, fat: 0, alcohol: 0, total: 0 },
  { name: '21 Jun', protein: 115, carbs: 195, fat: 48, alcohol: 18, total: 1722 },
];

const getWeeklyData = () => [
  { name: 'Week 1', protein: 602, carbs: 1087, fat: 258, alcohol: 32, total: 9143 },
  { name: 'Week 2', protein: 578, carbs: 1012, fat: 234, alcohol: 48, total: 8723 },
  { name: 'Week 3', protein: 612, carbs: 1134, fat: 267, alcohol: 24, total: 9435 },
  { name: 'Week 4', protein: 589, carbs: 1056, fat: 249, alcohol: 36, total: 9012 },
];

const getMonthlyData = () => [
  { name: 'January', protein: 2412, carbs: 4352, fat: 1032, alcohol: 124, total: 36572 },
  { name: 'February', protein: 2235, carbs: 4128, fat: 968, alcohol: 98, total: 34392 },
  { name: 'March', protein: 2356, carbs: 4267, fat: 1048, alcohol: 142, total: 37652 },
  { name: 'April', protein: 2289, carbs: 4156, fat: 1012, alcohol: 112, total: 36210 },
  { name: 'May', protein: 2342, carbs: 4287, fat: 1025, alcohol: 135, total: 37156 },
  { name: 'June', protein: 2381, carbs: 4289, fat: 1008, alcohol: 128, total: 37313 },
];

// Helper to get week start/end dates from ISO week string (e.g., '2025-W26')
function getWeekDateRange(isoWeek) {
  const [year, weekStr] = isoWeek.split('-W');
  const week = parseInt(weekStr, 10);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
  return {
    start: ISOweekStart,
    end: ISOweekEnd
  };
}

export const MacroChart = ({ unit, viewMode, data }) => {
  let chartData = data && data.length > 0 ? data : [];

  // If no data, show a message
  if (!chartData.length) {
    return <div className="w-full h-80 flex items-center justify-center text-gray-500">No data available for this period.</div>;
  }

  // Optionally, convert macros to kcal if needed (if not already in kcal)
  const convertedData = chartData.map(day => ({
    ...day,
    protein: Math.round(day.protein * 4) < 1 ? 0 : Math.round(day.protein * 4),
    carbs: Math.round(day.carbs * 4) < 1 ? 0 : Math.round(day.carbs * 4),
    fat: Math.round(day.fat * 9) < 1 ? 0 : Math.round(day.fat * 9),
    total: day.total
  }));

  // Custom tooltip for weekly view
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let weekRange = '';
      if (viewMode === 'weekly') {
        const { start, end } = getWeekDateRange(label);
        weekRange = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      }
      const totalKcal = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white p-3 rounded shadow text-sm" style={{ border: '1px solid #eee', minWidth: 140 }}>
          <div><strong>Date:</strong> {label}</div>
          {weekRange && <div className="text-gray-500 mb-1">{weekRange}</div>}
          {payload.map((entry, idx) => (
            <div key={idx} style={{ color: entry.color, marginBottom: 2 }}>
              <b>{entry.name}:</b> <span style={{ fontWeight: 600 }}>{entry.value} {unit}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, fontWeight: 600, color: '#333' }}>Total: {totalKcal} kcal</div>
        </div>
      );
    }
    return null;
  };

  // Custom x-axis label for weekly view
  const CustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    let label = payload.value;
    if (viewMode === 'weekly') {
      // Only format if label matches 'YYYY-Wxx' pattern
      const weekMatch = /^\d{4}-W\d{1,2}$/.test(label);
      if (weekMatch) {
        const { start, end } = getWeekDateRange(label);
        if (!isNaN(start) && !isNaN(end)) {
          label = `W${label.split('-W')[1]} (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        }
      }
      // If not a valid week string, just show the label as-is (prevents Wundefined)
    }
    return <text x={x} y={y + 15} textAnchor="middle" fill="#666">{label}</text>;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={convertedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={viewMode === 'daily' ? 30 : 50}
        >
          {/* Gradients for modern bar colors */}
          <defs>
            <linearGradient id="proteinGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6dd47e" />
              <stop offset="100%" stopColor="#219150" />
            </linearGradient>
            <linearGradient id="carbsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4fc3f7" />
              <stop offset="100%" stopColor="#1976d2" />
            </linearGradient>
            <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd54f" />
              <stop offset="100%" stopColor="#ffa000" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={<CustomXAxisTick />} />
          <YAxis label={{ value: 'kcal', angle: -90, position: 'insideLeft', fontSize: 14 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {/* Value labels on bars */}
          <Bar dataKey="protein" stackId="a" fill="url(#proteinGradient)" name="Protein" isAnimationActive={true} animationDuration={800} />
          <Bar dataKey="carbs" stackId="a" fill="url(#carbsGradient)" name="Carbs" isAnimationActive={true} animationDuration={800} />
          <Bar dataKey="fat" stackId="a" fill="url(#fatGradient)" name="Fat" isAnimationActive={true} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

MacroChart.defaultProps = {
  data: []
};
