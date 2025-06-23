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

export const MacroChart = ({ unit, viewMode }) => {
  let data;
  if (viewMode === 'daily') {
    data = getDailyData();
  } else if (viewMode === 'weekly') {
    data = getWeeklyData();
  } else {
    data = getMonthlyData();
  }

  const convertedData = data.map(day => ({
    ...day,
    protein: Math.round(day.protein * 4),
    carbs: Math.round(day.carbs * 4),
    fat: Math.round(day.fat * 9),
    alcohol: Math.round(day.alcohol * 7),
    total: day.total
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={convertedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={viewMode === 'daily' ? 30 : 50}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip
            formatter={(value, name) => [`${value} ${unit}`, name.charAt(0).toUpperCase() + name.slice(1)]}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #f1f1f1',
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)'
            }}
          />
          <Legend />
          <Bar dataKey="protein" stackId="a" fill="#4CAF50" name="Protein" />
          <Bar dataKey="carbs" stackId="a" fill="#2196F3" name="Carbs" />
          <Bar dataKey="fat" stackId="a" fill="#FFC107" name="Fat" />
          <Bar dataKey="alcohol" stackId="a" fill="#FF5722" name="Alcohol" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
