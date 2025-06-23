import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect } from 'react';

// Mock data for macro distribution
const macroDistributionData = [
  { name: 'Protein', value: 29, color: '#4CAF50' },
  { name: 'Carbs', value: 58, color: '#2196F3' },
  { name: 'Fat', value: 13, color: '#FFC107' },
];

// Mock data for meal timing
const mealTimingData = [
  { time: 'Breakfast', calories: 450 },
  { time: 'Snack', calories: 150 },
  { time: 'Lunch', calories: 750 },
  { time: 'Snack', calories: 180 },
  { time: 'Dinner', calories: 650 },
  { time: 'Late Snack', calories: 120 },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}


const NutritionChart = () => {
  const isMobile = useIsMobile()
  const [chartType, setChartType] = useState('macro');


  const renderPercentLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, fill
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    // Only show label if the slice is big enough
    if (percent < 0.08) return null;
  
    return (
      <g>
        <rect
          x={x - 22}
          y={y - 16}
          width={44}
          height={32}
          rx={8}
          fill="#fff"
          opacity={0.85}
          stroke={fill}
          strokeWidth={2}
        />
        <text
          x={x}
          y={y}
          fill={fill}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          style={{ pointerEvents: 'none' }}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">Nutrition Insights</h2>

        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${chartType === 'macro'
              ? 'bg-[#c41e3a] text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setChartType('macro')}
          >
            Macro Distribution
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-md ${chartType === 'timing'
              ? 'bg-[#c41e3a] text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            onClick={() => setChartType('timing')}
          >
            Meal Timing
          </button>
        </div>
      </div>

      <div className="h-80">
        {chartType === 'macro' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="flex flex-col justify-center">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Average Macro Distribution</h3>
              <p className="text-gray-600 mb-2">Your macronutrient balance over the past 30 days</p>
              <div className="space-y-3 mt-4">
                {macroDistributionData.map(item => (
                  <div key={item.name}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${item.value}%`,
                          backgroundColor: item.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Your current ratio aligns with your selected diet type. <a href="#" className="text-[#c41e3a]">Learn more</a></p>
              </div>
            </div>

           {!isMobile && <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={renderPercentLabel}
                    labelLine={false}
                  >
                    {macroDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Percentage']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid #f1f1f1',
                      borderRadius: '4px',
                      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

            </div>}
          </div>
        )}

        {chartType === 'timing' && (
          <div className="h-full">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Meal Timing Distribution</h3>
            <p className="text-gray-600 mb-4">When you consume your calories throughout the day</p>

            <ResponsiveContainer width="100%" height="80%">
              <BarChart
                data={mealTimingData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} kcal`, 'Calories']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #f1f1f1',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
                  }}
                />
                <Bar dataKey="calories" fill="#c41e3a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionChart;
