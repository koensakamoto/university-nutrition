import React, { useState } from "react"
import { SendIcon, BotIcon } from "lucide-react"

// Utility to get local date string in YYYY-MM-DD format
function getLocalDateString(date) {
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

const AIAssistant = ({ 
    isMobile = false, 
    addToTracker,
    diningHall,
    mealType,
    date
}) => {
    const [query, setQuery] = useState("")
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content:
                'Hi there! I can help you find the right food options. Try asking me questions like "What\'s the highest-protein vegan meal today?" or "Build me a 700-calorie lunch."',
        },
    ])
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault();
        if (!query.trim() || isLoading) {
            return;
        }

        const userMessage = {
            role: "user",
            content: query
        };
        setChatHistory(prev => [...prev, userMessage])
        setIsLoading(true)
        setQuery("")

        try {
            const res = await fetch('/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    query: query,
                    dining_hall: diningHall,
                    meal_type: mealType,
                    date: getLocalDateString(date)
                }),
                credentials: 'include'
            });

            if(!res.ok) {
                throw new Error("Failed to get response from assistant");
            }
            
            const assistantResponse = await res.json();
            
            setChatHistory(prev => [...prev, assistantResponse]);

            if (assistantResponse.action === 'add_to_tracker' && assistantResponse.item) {
                addToTracker(assistantResponse.item);
            }

        } catch (error) {
            console.error("Assistant API error:", error);
            const errorMessage = {
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting. Please try again later."
            };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={`bg-white rounded-lg shadow ${isMobile ? '' : 'h-100'}`}>
          <div className="p-4 bg-red-600 text-white rounded-t-lg flex items-center">
            <BotIcon size={20} className="mr-2" />
            <h3 className="font-medium">Nutrition Assistant</h3>
          </div>
          <div className={`p-4 overflow-y-auto ${isMobile ? 'max-h-60' : 'h-72'}`}>
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`mb-3 ${message.role === 'user' ? 'bg-red-100 ml-8 rounded-tl-lg rounded-bl-lg rounded-tr-lg' : 'bg-gray-100 mr-8 rounded-tr-lg rounded-br-lg rounded-tl-lg'} p-3`}
              >
                {message.content}
              </div>
            ))}
             {isLoading && (
                    <div className="mb-3 bg-gray-100 mr-8 rounded-tr-lg rounded-br-lg rounded-tl-lg p-3">
                        ...
                    </div>
                )}
          </div>
          <div className="p-3 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about nutrition or meals..."
                className="flex-grow px-3 h-10 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-red-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-red-600 text-white px-4 h-10 rounded-r-md hover:bg-red-700 focus:outline-none flex items-center justify-center disabled:bg-red-400"
                disabled={isLoading}
              >
                <SendIcon size={18} />
              </button>
            </form>
          </div>
        </div>
      )
}

export default AIAssistant;