import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'

const FilterBar = ({
    diningHall,
    setDiningHall,
    date,
    setDate,
    mealType,
    setMealType,
}) => {
    const [diningHalls, setDiningHalls] = useState([])
    const [mealTypesByHall, setMealTypesByHall] = useState({})
    const [mealTypes, setMealTypes] = useState([])

    useEffect(() => {
        if (date) {
            const formattedDate = date.getFullYear() + '-' +
                String(date.getMonth() + 1).padStart(2, '0') + '-' +
                String(date.getDate()).padStart(2, '0');
            fetch(`/api/available-options?date=${formattedDate}`)
                .then(res => res.json())
                .then(data => {
                    setDiningHalls(data.dining_halls);
                    setMealTypesByHall(data.meal_types_by_hall);
                    // If a dining hall is already selected, update mealTypes
                    if (diningHall && data.meal_types_by_hall[diningHall]) {
                        setMealTypes(data.meal_types_by_hall[diningHall]);
                        // If current mealType is not valid, reset it
                        if (!data.meal_types_by_hall[diningHall].includes(mealType)) {
                            setMealType('');
                        }
                    } else {
                        setMealTypes([]);
                        setMealType('');
                    }
                })
                .catch(() => {
                    setDiningHalls([]);
                    setMealTypesByHall({});
                    setMealTypes([]);
                    setMealType('');
                });
        } else {
            setDiningHalls([]);
            setMealTypesByHall({});
            setMealTypes([]);
            setMealType('');
        }
        // eslint-disable-next-line
    }, [date]);

    useEffect(() => {
        if (diningHall && mealTypesByHall[diningHall]) {
            setMealTypes(mealTypesByHall[diningHall]);
            // If current mealType is not valid, reset it
            if (!mealTypesByHall[diningHall].includes(mealType)) {
                setMealType('');
            }
        } else {
            setMealTypes([]);
            setMealType('');
        }
        // eslint-disable-next-line
    }, [diningHall, mealTypesByHall]);

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Dining Hall Selector */}
                <div>
                    <label
                        htmlFor="dining-hall"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Dining Hall
                    </label>
                    <div className="relative">
                        <select
                            id="dining-hall"
                            value={diningHall}
                            onChange={(e) => setDiningHall(e.target.value)}
                            className="appearance-none block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="">Select Dining Hall</option>
                            {diningHalls.map((hall) => (
                                <option key={hall} value={hall}>
                                    {hall}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDownIcon className="text-gray-500" size={20} />
                        </div>
                    </div>
                </div>
                {/* Date Picker */}
                <div>
                    <label
                        htmlFor="date"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Date
                    </label>
                    <div className="relative">
                        <DatePicker
                            selected={date}
                            onChange={(date) => setDate(date)}
                            className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            wrapperClassName="w-full"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                            <CalendarIcon size={16} />
                        </div>
                    </div>
                </div>
                {/* Meal Type Selector */}
                <div>
                    <label
                        htmlFor="meal-type"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Meal
                    </label>
                    <div className="relative">
                        <select
                            id="meal-type"
                            value={mealType}
                            onChange={(e) => setMealType(e.target.value)}
                            className="appearance-none block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="">Select Meal Type</option>
                            {mealTypes.map((meal) => (
                                <option key={meal} value={meal}>
                                    {meal}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDownIcon className="text-gray-500" size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default FilterBar
