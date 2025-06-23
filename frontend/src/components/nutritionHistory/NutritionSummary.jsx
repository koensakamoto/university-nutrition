import React from 'react';

// Mock data for the summary cards
const summaryData = [
  {
    title: 'Average Daily Calories',
    value: '2,134',
    target: '2,400',
    unit: 'kcal',
    color: '#c41e3a',
    percentComplete: 89,
    trend: 'up',
    trendValue: '5%'
  },
  {
    title: 'Protein Intake',
    value: '102',
    target: '120',
    unit: 'g',
    color: '#4CAF50',
    percentComplete: 85,
    trend: 'up',
    trendValue: '3%'
  },
  {
    title: 'Average Meal Count',
    value: '4.2',
    target: '5',
    unit: 'meals/day',
    color: '#2196F3',
    percentComplete: 84,
    trend: 'neutral',
    trendValue: '0%'
  },
  {
    title: 'Days Tracked',
    value: '27',
    target: '30',
    unit: 'days',
    color: '#FF9800',
    percentComplete: 90,
    trend: 'up',
    trendValue: '10%'
  }
];

export const NutritionSummary = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryData.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: card.color }}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-600 text-sm">{card.title}</h3>
            
            {card.trend === 'up' && (
              <span className="text-green-600 text-xs flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                {card.trendValue}
              </span>
            )}
            
            {card.trend === 'down' && (
              <span className="text-red-600 text-xs flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1v-5a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L12 8.414l-3.293 3.293a1 1 0 010 1.414L12 13z" clipRule="evenodd" />
                </svg>
                {card.trendValue}
              </span>
            )}
            
            {card.trend === 'neutral' && (
              <span className="text-gray-500 text-xs flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {card.trendValue}
              </span>
            )}
          </div>
          
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-800">{card.value}</span>
            <span className="text-sm text-gray-500 ml-1">/ {card.target} {card.unit}</span>
          </div>
          
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div 
                  style={{ 
                    width: `${card.percentComplete}%`,
                    backgroundColor: card.color
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded"
                ></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
