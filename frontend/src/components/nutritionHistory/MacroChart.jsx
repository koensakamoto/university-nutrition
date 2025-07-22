import React, { useMemo } from 'react';
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
import { format, parseISO } from 'date-fns';



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

export const MacroChart = ({ unit, viewMode, data, loading }) => {
  let chartData = data && data.length > 0 ? data : [];

  // Show loading state
  if (loading) {
    return <div className="w-full h-80 flex items-center justify-center text-gray-500">Loading chart data...</div>;
  }

  // If no data, show a message
  if (!chartData.length) {
    return <div className="w-full h-80 flex items-center justify-center text-gray-500">No data available for this period.</div>;
  }

  // Use direct values from chartData for macros
  const convertedData = useMemo(() => {
    return chartData.map(day => {
      const protein = typeof day.protein === 'number' ? day.protein : 0;
      const carbs = typeof day.carbs === 'number' ? day.carbs : 0;
      const fat = typeof day.fat === 'number' ? day.fat : 0;
      // Calculate calories from macros for display if needed
      const calories = (protein * 4) + (carbs * 4) + (fat * 9);
      return {
        ...day,
        protein: Math.round(protein * 4) < 1 ? 0 : Math.round(protein * 4),
        carbs: Math.round(carbs * 4) < 1 ? 0 : Math.round(carbs * 4),
        fat: Math.round(fat * 9) < 1 ? 0 : Math.round(fat * 9),
        total: Math.round(calories)
      };
    });
  }, [chartData]);

  // Determine XAxis interval based on data length
  let xAxisInterval = 0;
  if (viewMode === 'monthly') xAxisInterval = 0; // always show all months
  else if (convertedData.length > 90) xAxisInterval = 29; // about one label per month for 6 months
  else if (convertedData.length > 30) xAxisInterval = 6; // about one label per week
  else if (convertedData.length > 14) xAxisInterval = 2;
  else if (convertedData.length > 7) xAxisInterval = 1;
  else xAxisInterval = 0;

  // Custom tooltip for weekly view
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      let displayLabel = label;
      if (viewMode === 'weekly') {
        const weekMatch = /^\d{4}-W\d{1,2}$/.test(label);
        if (weekMatch) {
          const [year, weekStr] = label.split('-W');
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
          displayLabel = `${format(ISOweekStart, 'MMM d')}–${format(ISOweekEnd, 'MMM d')}`;
        }
      } else if (viewMode === 'monthly') {
        if (/^\d{4}-\d{2}$/.test(label)) {
          try {
            displayLabel = format(parseISO(label + '-01'), 'MMM yyyy');
          } catch {}
        }
      }
      const totalKcal = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white p-3 rounded shadow text-sm" style={{ border: '1px solid #eee', minWidth: 140 }}>
          <div><strong>Date:</strong> {displayLabel}</div>
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

  // Custom x-axis label for daily/weekly/monthly view
  const CustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    let label = payload.value;
    if (viewMode === 'daily') {
      try {
        label = format(parseISO(label), 'MMM d');
      } catch {}
    } else if (viewMode === 'weekly') {
      const weekMatch = /^\d{4}-W\d{1,2}$/.test(label);
      if (weekMatch) {
        const [year, weekStr] = label.split('-W');
        const week = parseInt(weekStr, 10);
        // Get week start/end
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = new Date(simple);
        if (dow <= 4)
          ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
          ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        const ISOweekEnd = new Date(ISOweekStart);
        ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
        label = `${format(ISOweekStart, 'MMM d')}–${format(ISOweekEnd, 'MMM d')}`;
      }
    } else if (viewMode === 'monthly') {
      if (/^\d{4}-\d{2}$/.test(label)) {
        try {
          label = format(parseISO(label + '-01'), 'MMM yyyy');
        } catch {}
      }
    }
    // Angle the label by 30deg for better fit
    return (
      <g transform={`translate(${x},${y + 10})`}>
        <text x={0} y={0} textAnchor="end" fill="#666" fontSize={12} transform="rotate(-30)">{label}</text>
      </g>
    );
  };

  return (
    <div className="w-full h-80">
      {/* Move legend above the chart */}
      <div className="flex justify-center mb-2">
        <span className="flex items-center mr-4"><span className="w-4 h-4 inline-block rounded bg-[#4CAF50] mr-1"></span>Protein</span>
        <span className="flex items-center mr-4"><span className="w-4 h-4 inline-block rounded bg-[#2196F3] mr-1"></span>Carbs</span>
        <span className="flex items-center"><span className="w-4 h-4 inline-block rounded bg-[#FFC107] mr-1"></span>Fat</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={convertedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
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
          <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={xAxisInterval} />
          <YAxis label={{ value: 'kcal', angle: -90, position: 'insideLeft', fontSize: 14 }} />
          <Tooltip content={<CustomTooltip />} />
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
