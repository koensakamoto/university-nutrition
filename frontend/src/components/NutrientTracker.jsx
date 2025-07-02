import React, { useState } from 'react'
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
import { XIcon, DownloadIcon, TrashIcon, ClipboardPlus, CheckIcon } from 'lucide-react'

const NutrientTracker = ({ trackedItems, removeItem, clearItems, selectedDate, onSavePlate }) => {
    const [saveSuccess, setSaveSuccess] = useState(false);
    const plateEmpty = trackedItems.length === 0;
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
    const handleSave = async () => {
        if (onSavePlate) {
            await onSavePlate();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        }
    }
    return (
        <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col h-full border border-gray-100">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">My Plate</h2>
                <button
                    onClick={clearItems}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                    title="Clear plate"
                >
                    <TrashIcon size={18} />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
            {plateEmpty ? (
                <div className="text-center h-full px-4 text-gray-500 flex flex-col items-center justify-center">
                    <ClipboardPlus size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">Your plate is empty</h3>
                    <p className="text-sm mt-1">Add items from the menu to see your nutrition breakdown.</p>
                </div>
            ) : (
                <>
                    <div className="mb-4 grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-gray-800">{totals.calories}</div>
                            <div className="text-xs text-gray-500">Calories</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-blue-600">{totals.protein}g</div>
                            <div className="text-xs text-gray-500">Protein</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-green-600">{totals.carbs}g</div>
                            <div className="text-xs text-gray-500">Carbs</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-orange-600">{totals.fat}g</div>
                            <div className="text-xs text-gray-500">Fat</div>
                        </div>
                    </div>
                    <div className="my-4 border-t border-gray-200"></div>
                    <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 bg-[#c41e3a] text-white font-semibold py-2 rounded-lg shadow hover:bg-[#a81b2b] transition mb-2"
                        disabled={saveSuccess}
                    >
                        {saveSuccess ? (
                            <CheckIcon className="h-5 w-5" />
                        ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2M7 10V6a2 2 0 012-2h6a2 2 0 012 2v4m-5 4h.01"></path>
                            </svg>
                        )}
                        {saveSuccess ? 'Saved!' : 'Save Plate'}
                    </button>
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Calorie Breakdown</h3>
                        <ResponsiveContainer width="100%" height={120}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={40}
                                    innerRadius={28}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{
                                        paddingTop: "20px",
                                        height: "40px",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">% Daily Values</h3>
                        <ResponsiveContainer width="100%" height={140}>
                            <BarChart
                                data={barData}
                                layout="vertical"
                                margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
                                barCategoryGap={14}
                            >
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={70}
                                    tick={{ fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip formatter={v => `${v.toFixed(0)}%`} />
                                <Bar dataKey="percent" radius={[6, 6, 6, 6]} barSize={14}>
                                    {barData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Items on your plate</h3>
                        <ul className="divide-y divide-gray-200">
                            {trackedItems.map((item) => (
                                <li
                                    key={item.uniqueId}
                                    className="py-2 flex justify-between items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.calories} cal · {item.portionSize}</p>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.uniqueId)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <XIcon size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
            </div>
        </div>
    )
}
export default NutrientTracker
