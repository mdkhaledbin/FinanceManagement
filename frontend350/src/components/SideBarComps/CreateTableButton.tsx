import React, { useState } from "react";
import CreateTableModal from "./CreateTableModal";
import { useTheme } from "@/context/ThemeProvider";

const CreateTableButton: React.FC = () => {
  const [showTableCreateModal, setShowTableCreateModal] =
    useState<boolean>(false);
  const { theme } = useTheme();

  const handleToggleModal = () => {
    setShowTableCreateModal(!showTableCreateModal);
  };

  return (
    <>
      <button
        onClick={handleToggleModal}
        className={`flex items-center justify-center gap-3 w-full py-3.5 px-4 mb-4 rounded-xl 
          bg-gradient-to-br hover:from-indigo-400/80 hover:via-blue-400/80 hover:to-cyan-400/80 
          from-indigo-500/90 via-blue-500/90 to-cyan-500/90
           font-medium text-[16px] tracking-wide
          transition-all duration-500 ease-in-out shadow-lg hover:shadow-xl 
          hover:-translate-y-0.5 active:scale-[0.98]
          border border-indigo-300/20
          font-['Inter'] ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          } text-5xl`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 animate-pulse"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className={`font-extrabold`}>Create New Table</span>
      </button>

      {showTableCreateModal && (
        <CreateTableModal onCloseModal={handleToggleModal} />
      )}
    </>
  );
};

export default CreateTableButton;
