import React, { useState } from "react"
import { SendIcon, BotIcon } from "lucide-react"

const AIAssistant = ({ isMobile = false }) => {
    const [query, setQuery] = useState("")
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content:
                'Hi there! I can help you find the right food options. Try asking me questions like "What\'s the highest-protein vegan meal today?" or "Build me a 700-calorie lunch."',
        },
    ])

    function handleSubmit(e) {
        e.preventDefault();
        if (!query.trim()) {
            return;
        }

        setChatHistory(prev => [...prev,
        {
            role: "user",
            content: query

        }])

        AssistantResponse();

        setQuery("")
    }

    function AssistantResponse(){
        // call api
        

        setChatHistory(prev => [...prev,
            {
                role: "assistant",
                response: "response"
            }

        ])
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
          </div>
          <div className="p-3 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about nutrition or meals..."
                className="flex-grow px-3 h-10 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                type="submit"
                className="bg-red-600 text-white px-4 h-10 rounded-r-md hover:bg-red-700 focus:outline-none flex items-center justify-center"
              >
                <SendIcon size={18} />
              </button>
            </form>
          </div>
        </div>
      )
}






export default AIAssistant;