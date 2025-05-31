import React from "react";
import { useTheme } from "@/context/ThemeProvider";

const ChatArea = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`w-full h-full ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
      <div className="h-full flex flex-col">
        {/* Chat header */}
        <div className={`p-4 border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}>
          <h2 className={`text-lg font-semibold ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}>Chat</h2>
        </div>
        
        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto p-4 pt-10">
          {/* Messages would go here */}
          HI
        </div>
        
        {/* Chat input */}
        <div className={`p-4 border-t ${
          theme === "dark" ? "border-gray-700 bg-gray-700" : "border-gray-200 bg-gray-50"
        }`}>
          <input
            type="text"
            placeholder="Type a message..."
            className={`w-full p-3 rounded-lg ${
              theme === "dark" 
                ? "bg-gray-600 text-white placeholder-gray-400" 
                : "bg-white text-gray-800 placeholder-gray-500"
            } border ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            } focus:outline-none focus:ring-2 ${
              theme === "dark" ? "focus:ring-blue-500" : "focus:ring-blue-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;