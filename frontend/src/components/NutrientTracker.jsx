import React from 'react'
import {
    PieChart,
    Pie,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts'
import { XIcon, DownloadIcon, TrashIcon, ClipboardPlus } from 'lucide-react'
const NutrientTracker = ({ trackedItems, removeItem, clearItems }) => {
    // Calculate nutrition totals
    const totals = trackedItems.reduce(
        (acc, item) => {
            return {
                calories: acc.calories + item.calories,
                protein: acc.protein + item.protein,
                carbs: acc.carbs + item.carbs,
                fat: acc.fat + item.totalFat,
            }
        },
        {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
        },
    )
    // Data for pie chart
    const pieData = [
        {
            name: 'Protein',
            value: totals.protein * 4,
            color: '#4299e1',
        },
        {
            name: 'Carbs',
            value: totals.carbs * 4,
            color: '#48bb78',
        },
        {
            name: 'Fat',
            value: totals.fat * 9,
            color: '#ed8936',
        }, // 9 calories per gram
    ]
    // Data for bar chart (% of daily recommended values)
    const barData = [
        {
            name: 'Calories',
            percent: (totals.calories / 2000) * 100,
            color: '#4c51bf',
        },
        {
            name: 'Protein',
            percent: (totals.protein / 50) * 100,
            color: '#4299e1',
        },
        {
            name: 'Carbs',
            percent: (totals.carbs / 275) * 100,
            color: '#48bb78',
        },
        {
            name: 'Fat',
            percent: (totals.fat / 78) * 100,
            color: '#ed8936',
        },
    ]
    const exportData = () => {
        // In a real app, this would generate a PDF or CSV
        alert('Export functionality would go here!')
    }
    return (
        <div className="bg-white rounded-lg p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">My Plate</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={exportData}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                        title="Export data"
                    >
                        <DownloadIcon size={18} />
                    </button>
                    <button
                        onClick={clearItems}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                        title="Clear plate"
                    >
                        <TrashIcon size={18} />
                    </button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto">
            {trackedItems.length === 0 ? (
                <div className="text-center h-full px-4 text-gray-500 flex flex-col items-center justify-center">
                    <ClipboardPlus size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">Your plate is empty</h3>
                    <p className="text-sm mt-1">Add items from the menu to see your nutrition breakdown.</p>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <div className="text-xl font-bold text-gray-800">
                                    {totals.calories}
                                </div>
                                <div className="text-xs text-gray-500">Calories</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <div className="text-xl font-bold text-blue-600">
                                    {totals.protein}g
                                </div>
                                <div className="text-xs text-gray-500">Protein</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <div className="text-xl font-bold text-green-600">
                                    {totals.carbs}g
                                </div>
                                <div className="text-xs text-gray-500">Carbs</div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <div className="text-xl font-bold text-orange-600">
                                    {totals.fat}g
                                </div>
                                <div className="text-xs text-gray-500">Fat</div>
                            </div>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Calorie Breakdown
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{
                                            paddingTop: "20px",
                                            height: "40px", // Add a fixed height to the legend wrapper
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                            % Daily Values
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={barData}
                                    layout="vertical"
                                    margin={{ left: 0 }}
                                >
                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                    />
                                    <YAxis type="category" dataKey="name" width={70} /> {/* Added Y-axis for category names */}
                                    <Tooltip
                                        formatter={(value) => [`${Math.round(value)}%`, '']}
                                    />
                                    <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Items on your plate
                        </h3>
                        <ul className="divide-y divide-gray-200">
                            {trackedItems.map((item) => {
                                console.log("item", item)
                                return (
                                    <li
                                        key={item.uniqueId}
                                        className="py-2 flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.calories} cal · {item.portionSize}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.uniqueId)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <XIcon size={16} />
                                        </button>
                                    </li>
                                );
                            })}

                        </ul>
                    </div>
                </>
            )}
            </div>
        </div>
    )
}
export default NutrientTracker
