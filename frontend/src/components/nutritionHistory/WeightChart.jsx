import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Mock data for the weight chart
const data = [
  { date: 'Jan 1', weight: 173.2, goal: 170 },
  { date: 'Jan 15', weight: 172.8, goal: 170 },
  { date: 'Feb 1', weight: 172.1, goal: 170 },
  { date: 'Feb 15', weight: 171.5, goal: 170 },
  { date: 'Mar 1', weight: 171.2, goal: 170 },
  { date: 'Mar 15', weight: 170.8, goal: 170 },
  { date: 'Apr 1', weight: 170.3, goal: 170 },
  { date: 'Apr 15', weight: 170.1, goal: 170 },
  { date: 'May 1', weight: 169.9, goal: 170 },
  { date: 'May 15', weight: 169.8, goal: 170 },
  { date: 'Jun 1', weight: 169.7, goal: 170 },
  { date: 'Jun 15', weight: 169.7, goal: 170 },
];

export const WeightChart = () => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" />
          <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
          <Tooltip 
            formatter={(value) => [`${value} lbs`, 'Weight']}
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
          <Line 
            type="monotone" 
            dataKey="goal" 
            stroke="#b7e4c7" 
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
