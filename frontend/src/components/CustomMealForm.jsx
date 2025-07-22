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
    const finalMeal = {
      id: `custom-${crypto.randomUUID()}`,
      portionSize: '1 serving',
      ...meal,
      calories: parseFloat(meal.calories) || 0,
      protein: parseFloat(meal.protein) || 0,
      carbs: parseFloat(meal.carbs) || 0,
      totalFat: parseFloat(meal.totalFat) || 0,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Add Custom Meal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
              Add Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomMealForm; 