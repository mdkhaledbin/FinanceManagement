import React from "react";
import { useTheme } from "@/context/ThemeProvider";

interface ToggleChatProps {
  onToggle: () => void;
}

const ToggleChat = ({ onToggle }: ToggleChatProps) => {
  const { theme } = useTheme();

  return (
    <div className="fixed right-4 bottom-4 z-500">
      <div className="relative">
        <button
          onClick={onToggle}
          className={`relative 
            ${
              theme === "dark"
                ? "bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600"
                : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400"
            }
            text-white font-medium py-3 px-6 
            rounded-full
            shadow-lg hover:shadow-xl 
            transform hover:scale-105 
            transition-all duration-500 ease-in-out
            flex items-center justify-center gap-2
            hover:outline-none hover:ring-2 
            ${
              theme === "dark"
                ? "hover:ring-purple-500"
                : "hover:ring-purple-300"
            }
            hover:ring-opacity-50
            backdrop-blur-sm
            border border-opacity-20
            ${theme === "dark" ? "border-purple-400" : "border-purple-300"}
          `}
        >
          <span className="flex items-center gap-2 transition-all duration-500 ease-in-out">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 transition-all duration-500 ease-in-out"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="transition-all duration-500 ease-in-out">
              Chat
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ToggleChat;
