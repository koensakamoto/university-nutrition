import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const WeightChart = ({ weightData = [] }) => {
  // Format data for recharts: convert date to 'MMM d' for X axis and add goal weight
  const chartData = (weightData || []).map(entry => {
    let formattedDate;
    try {
      // Handle both 'YYYY-MM-DD' strings and Date objects
      // For YYYY-MM-DD format, parse manually to avoid timezone issues
      if (typeof entry.date === 'string' && entry.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = entry.date.split('-').map(Number);
        const d = new Date(year, month - 1, day); // month is 0-indexed
        
        const today = new Date();
        const currentYear = today.getFullYear();
        const entryYear = d.getFullYear();
        
        // Include year if it's different from current year
        if (entryYear !== currentYear) {
          formattedDate = d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        } else {
          formattedDate = d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }
      } else {
        // Fallback for other date formats
        const d = new Date(entry.date);
        if (isNaN(d.getTime())) {
          formattedDate = entry.date;
        } else {
          const today = new Date();
          const currentYear = today.getFullYear();
          const entryYear = d.getFullYear();
          
          if (entryYear !== currentYear) {
            formattedDate = d.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          } else {
            formattedDate = d.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
      }
    } catch {
      formattedDate = entry.date;
    }
    
    return {
      ...entry,
      date: formattedDate,
      originalDate: entry.date, // Keep original for sorting
      weight: parseFloat(entry.weight) || 0,
      // Add goal weight if it exists in the entry, otherwise don't include it
      ...(entry.goal_weight !== undefined && { goal: parseFloat(entry.goal_weight) || 0 })
    };
  }).sort((a, b) => {
    // Sort by original date to ensure chronological order
    const dateA = new Date(a.originalDate);
    const dateB = new Date(b.originalDate);
    return dateA - dateB;
  });
  
  if (!chartData.length) {
    return <div className="w-full h-72 flex items-center justify-center text-gray-500">No weight data for this period.</div>;
  }


  // Calculate Y-axis domain safely
  const weights = chartData.map(d => d.weight).filter(w => w > 0);
  const goals = chartData.map(d => d.goal).filter(g => g !== undefined && g > 0);
  const allValues = [...weights, ...goals];
  
  let yAxisDomain;
  if (allValues.length > 0) {
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = Math.max(5, (maxValue - minValue) * 0.1);
    yAxisDomain = [Math.max(0, minValue - padding), maxValue + padding];
  } else {
    yAxisDomain = [0, 200]; // fallback range
  }
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            interval="preserveStartEnd"
            tick={{ fontSize: 12 }}
            angle={chartData.length > 10 ? -45 : 0}
            textAnchor={chartData.length > 10 ? "end" : "middle"}
            height={chartData.length > 10 ? 60 : 30}
          />
          <YAxis domain={yAxisDomain} />
          <Tooltip 
            formatter={(value, name) => [
              `${value} lbs`, 
              name === 'weight' ? 'Weight' : 'Goal Weight'
            ]}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #f1f1f1',
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#c41e3a" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: '#c41e3a', strokeWidth: 2, fill: 'white' }}
          />
          {chartData.some(d => d.goal !== undefined) && (
            <Line 
              type="monotone" 
              dataKey="goal" 
              stroke="#b7e4c7" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
