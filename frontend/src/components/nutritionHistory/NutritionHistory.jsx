import React, { useState, useEffect } from 'react';
import NutritionChart from './NutritionChart';
import { WeightChart } from './WeightChart';
import { MacroChart } from './MacroChart';
import { NutritionSummary } from './NutritionSummary';
import { DateRangeSelector } from './DateRangeSelector';
import { FilterControl } from './FilterControl';
import { useFetchWithAuth } from '../../AuthProvider';

export default function NutritionHistory(props) {
  const [dateRange, setDateRange] = useState('last-week');
  const [viewMode, setViewMode] = useState('daily');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [macroData, setMacroData] = useState([]);
  const [macroLoading, setMacroLoading] = useState(false);
  const fetchWithAuth = useFetchWithAuth();

  // Utility to get local date string in YYYY-MM-DD format
  const getLocalDateString = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  // Helper to get start and end date strings for API
  function getDateRangeBounds(range) {
    console.log('getDateRangeBounds', range);
    const today = new Date();
    let start, end; 
    end = new Date(today);
    switch (range) {
      case 'last-week':
        start = new Date(today);
        start.setDate(start.getDate() - 6);
        break;
      case 'last-two-weeks':
        start = new Date(today);
        start.setDate(start.getDate() - 13);
        break;
      case 'last-month':
        start = new Date(today);
        start.setDate(start.getDate() - 29);
        break;
      case 'last-three-months':
        start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        break;
      case 'last-six-months':
        start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        break;
      default:
        start = new Date(today);
        start.setDate(start.getDate() - 6);
    }
    // Format as YYYY-MM-DD
    const fmt = d => getLocalDateString(d);
    return { start: fmt(start), end: fmt(end) };
  }

  // Helper to aggregate macros by day/week/month
  function aggregateMacros(data, viewMode) {
    if (!data || data.length === 0) return [];
    if (viewMode === 'daily') {
      // Group by date
      const grouped = {};
      data.forEach(item => {
        if (!grouped[item.date]) grouped[item.date] = [];
        grouped[item.date].push(item);
      });
      return Object.entries(grouped).map(([date, items]) => ({
        name: date,
        date,
        calories: items.reduce((sum, i) => sum + i.calories, 0),
        protein: items.reduce((sum, i) => sum + i.protein, 0),
        carbs: items.reduce((sum, i) => sum + i.carbs, 0),
        fat: items.reduce((sum, i) => sum + i.fat, 0),
      })).sort((a, b) => a.date.localeCompare(b.date));
    } else if (viewMode === 'weekly') {
      // Group by ISO week
      const grouped = {};
      data.forEach(item => {
        const d = new Date(item.date);
        const year = d.getFullYear();
        const week = Math.ceil((((d - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
        const key = `${year}-W${week}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      return Object.entries(grouped).map(([week, items]) => ({
        name: week,
        calories: items.reduce((sum, i) => sum + i.calories, 0),
        protein: items.reduce((sum, i) => sum + i.protein, 0),
        carbs: items.reduce((sum, i) => sum + i.carbs, 0),
        fat: items.reduce((sum, i) => sum + i.fat, 0),
      })).sort((a, b) => a.name.localeCompare(b.name));
    } else if (viewMode === 'monthly') {
      // Group by month
      const grouped = {};
      data.forEach(item => {
        const key = item.date.slice(0, 7);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
      });
      return Object.entries(grouped).map(([month, items]) => ({
        name: month,
        calories: items.reduce((sum, i) => sum + i.calories, 0),
        protein: items.reduce((sum, i) => sum + i.protein, 0),
        carbs: items.reduce((sum, i) => sum + i.carbs, 0),
        fat: items.reduce((sum, i) => sum + i.fat, 0),
      })).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }

  // Helper to fill missing dates with zero values for daily view
  function fillMissingDates(aggregated, start, end) {
    const dateSet = new Set(aggregated.map(item => item.date));
    const result = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const found = aggregated.find(item => item.date === dateStr);
      if (found) {
        result.push(found);
      } else {
        result.push({
          name: dateStr,
          date: dateStr,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  // Fetch nutrition summary (only when dateRange changes)
  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      const { start, end } = getDateRangeBounds(dateRange);
      try {
        const [profileRes, energyRes, summaryRes] = await Promise.all([
          fetchWithAuth('/api/profile'),
          fetchWithAuth('/api/profile/energy-target'),
          fetchWithAuth(`/api/plate/summary?start_date=${start}&end_date=${end}`)
        ]);
        if (profileRes.error) throw new Error('Failed to fetch profile');
        if (energyRes.error) throw new Error('Failed to fetch energy target');
        if (summaryRes.error) throw new Error('Failed to fetch summary');
        const profile = profileRes.data;
        const { energy_target } = energyRes.data;
        const data = summaryRes.data;

        console.log('data', data);

        // Calculate macro targets
        const energyTarget = energy_target || 2400;
        const proteinRatio = profile.protein_ratio ?? 30;
        const carbRatio = profile.carb_ratio ?? 50;
        const proteinTarget = Math.round((energyTarget * (proteinRatio / 100)) / 4);
        const carbTarget = Math.round((energyTarget * (carbRatio / 100)) / 4);

        setSummaryData([
          {
            title: 'Average Daily Calories',
            value: data.average_calories,
            target: energyTarget,
            unit: 'kcal',
            color: '#c41e3a',
            percentComplete: Math.round((data.average_calories / energyTarget) * 100),
            trend: 'neutral',
            trendValue: '0%'
          },
          {
            title: 'Protein Intake',
            value: data.average_protein,
            target: proteinTarget,
            unit: 'g',
            color: '#4CAF50',
            percentComplete: Math.round((data.average_protein / proteinTarget) * 100),
            trend: 'neutral',
            trendValue: '0%'
          },
          {
            title: 'Carb Intake',
            value: data.average_carbs,
            target: carbTarget,
            unit: 'g',
            color: '#2196F3',
            percentComplete: Math.round((data.average_carbs / carbTarget) * 100),
            trend: 'neutral',
            trendValue: '0%'
          },
          {
            title: 'Days Tracked',
            value: data.days_tracked,
            target: data.total_days,
            unit: 'days',
            color: '#FF9800',
            percentComplete: Math.round((data.days_tracked / data.total_days) * 100),
            trend: 'neutral',
            trendValue: '0%'
          }
        ]);
      } catch (err) {
        setError(err.message);
        setSummaryData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [dateRange]);

  // Fetch macro data for chart (when dateRange or viewMode changes)
  useEffect(() => {
    const fetchMacroData = async () => {
      const { start, end } = getDateRangeBounds(dateRange);
      setMacroLoading(true);
      try {
        const { data, error } = await fetchWithAuth(`/api/plate/food-macros?start_date=${start}&end_date=${end}`);
        if (error) throw new Error('Failed to fetch macro data');
        const foodMacros = data;
        console.log('res', foodMacros);
        console.log('viewmode', viewMode);
        console.log('foodMacros', foodMacros); // Debug: log the raw macro data
        const aggregated = aggregateMacros(foodMacros, viewMode);
        if (viewMode === 'daily') {
          setMacroData(fillMissingDates(aggregated, start, end));
        } else {
          setMacroData(aggregated);
        }
      } catch (err) {
        setMacroData([]);
      } finally {
        setMacroLoading(false);
      }
    };
    fetchMacroData();
  }, [dateRange, viewMode]);

  return (
    <div className="max-w-4xl w-full mx-auto px-4 py-8">
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nutrition History</h1>
              <p className="text-gray-600">Track your eating patterns and nutritional progress</p>
            </div>
            
            <DateRangeSelector 
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {/* Content starts directly with the summary */}

          {/* Nutrition Summary */}
          {loading ? (
            <div className="text-center py-8">Loading summary...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : summaryData ? (
            <NutritionSummary summaryData={summaryData} />
          ) : null}
          
          {/* Energy Consumed Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Energy Consumed</h2>
                <p className="text-sm text-gray-500">Jun 15 - Jun 21, 2025</p>
              </div>
              
              <div className="flex space-x-2 mt-3 md:mt-0">
                <FilterControl
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>
            </div>
            
            <MacroChart unit="kcal" viewMode={viewMode} data={macroData} loading={macroLoading} />
          </div>
          
          {/* Weight Tracking Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Weight Progress</h2>
                <p className="text-sm text-gray-500">Dec 24, 2024 to Jun 21, 2025</p>
              </div>
              
              <div className="flex space-x-2 mt-3 md:mt-0">
                <button className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-gray-700">
                  Last 6 months ▾
                </button>
                <button className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-gray-700">
                  All Days ▾
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <WeightChart />
            
            <div className="flex justify-end mt-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <span className="w-3 h-3 inline-block rounded-full bg-[#c41e3a] mr-1"></span>
                  <span className="text-sm text-gray-600">Weight</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 inline-block rounded-full bg-[#b7e4c7] mr-1"></span>
                  <span className="text-sm text-gray-600">Goal Weight</span>
                </div>
                
              </div>
            </div>
          </div>
          
          {/* Additional Nutrition Charts */}
          <NutritionChart />
        </div>
      </div>
    </div>
  );
}
