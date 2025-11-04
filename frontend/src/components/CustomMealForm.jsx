import React, { useState } from 'react';
import { XIcon } from 'lucide-react';

const CustomMealForm = ({ isOpen, onClose, onAddItem }) => {
  const [meal, setMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    totalFat: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMeal(prevMeal => ({ ...prevMeal, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!meal.name.trim()) {
      alert('Please enter a meal name');
      return;
    }
    
    const calories = parseFloat(meal.calories) || 0;
    const protein = parseFloat(meal.protein) || 0;
    const carbs = parseFloat(meal.carbs) || 0;
    const totalFat = parseFloat(meal.totalFat) || 0;
    
    if (calories < 0 || protein < 0 || carbs < 0 || totalFat < 0) {
      alert('Nutrition values cannot be negative');
      return;
    }
    
    const finalMeal = {
      id: `custom-${crypto.randomUUID()}`,
      portionSize: '1 serving',
      ...meal,
      name: meal.name.trim(),
      calories,
      protein,
      carbs,
      totalFat,
    };
    onAddItem(finalMeal, 1);

    // Save to localStorage
    const savedMeals = JSON.parse(localStorage.getItem('customMeals')) || [];
    localStorage.setItem('customMeals', JSON.stringify([...savedMeals, finalMeal]));

    onClose();
    // Reset form
    setMeal({ name: '', calories: '', protein: '', carbs: '', totalFat: '' });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-800">Add Custom Meal</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XIcon size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Meal Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={meal.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="calories" className="block text-sm font-medium text-gray-700">Calories</label>
                <input
                  type="number"
                  name="calories"
                  id="calories"
                  value={meal.calories}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="protein" className="block text-sm font-medium text-gray-700">Protein (g)</label>
                <input
                  type="number"
                  name="protein"
                  id="protein"
                  value={meal.protein}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">Carbs (g)</label>
                <input
                  type="number"
                  name="carbs"
                  id="carbs"
                  value={meal.carbs}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="totalFat" className="block text-sm font-medium text-gray-700">Fat (g)</label>
                <input
                  type="number"
                  name="totalFat"
                  id="totalFat"
                  value={meal.totalFat}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Add Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomMealForm; 