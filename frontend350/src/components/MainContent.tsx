import React from "react";
import ChatArea from "./chat/ChatAreaReal"; //use ChatAreaReal after integration of Api
import ShowTable from "./MainComponents/ShowTable";
import { useTheme } from "@/context/ThemeProvider";

const MainContent = ({ showChat }: { showChat: boolean }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`flex flex-col lg:flex-row h-screen w-full ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-100"
      } transition-colors duration-500 ease-in-out overflow-hidden`}
    >
      {/* Main Table Area */}
      <div
        className={`${
          showChat ? "lg:w-3/5" : "w-full"
        } h-full overflow-hidden pt-[5vh] transition-all duration-500 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          <div
            className={`${
              showChat
                ? "hidden lg:block translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            } py-6 lg:py-10 h-screen overflow-hidden transition-all duration-500 ease-in-out transform ${
              showChat ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <ShowTable />
          </div>
        </div>
      </div>

      {/* Chat Area - conditionally rendered and responsive */}
      {showChat && (
        <>
          {/* Mobile overlay backdrop */}
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-0 transition-opacity duration-500 ease-in-out" />

          <div
            className={`fixed lg:relative inset-0 lg:inset-auto lg:w-2/5 z-10 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            } shadow-xl lg:shadow-none transition-all duration-500 ease-in-out transform ${
              showChat ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div
              className={`h-full flex flex-col border-l ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              } transition-colors duration-500 ease-in-out`}
            >
              <ChatArea />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MainContent;
