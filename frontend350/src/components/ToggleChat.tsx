import React from "react";

interface ToggleChatProps {
  onToggle: () => void;
}

const ToggleChat = ({ onToggle }: ToggleChatProps) => {
  return (
    <div className="fixed right-[3vw] bottom-[3vh] z-50">
      <div className="relative">
        <button
          onClick={onToggle}
          className="relative bg-gradient-to-r from-indigo-600 to-purple-600 
          text-white font-medium py-3 px-6 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl
          shadow-lg hover:shadow-xl transform hover:scale-105 
          transition-all duration-300 ease-in-out
          flex items-center justify-center gap-2
          hover:outline-none hover:ring-2 hover:ring-purple-800 hover:ring-opacity-50"
        >
          Chat
        </button>
      </div>
    </div>
  );
};

export default ToggleChat;
