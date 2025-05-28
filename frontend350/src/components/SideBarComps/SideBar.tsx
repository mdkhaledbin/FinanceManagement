import { getTableData } from "@/data/table";
import React from "react";
import SideBarEntries from "./SideBarEntries";
import { useTheme } from "@/context/ThemeProvider";

const SideBar = () => {
  const tablesData = getTableData("1");
  const { theme } = useTheme();

  return (
    <div
      className={`h-screen pt-[10vh] pl-[1.5vw] w-[20vw] flex flex-col ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      } transition-all duration-300 ease-in-out fixed md:relative`}
    >
      <h1
        className={`text-3xl font-bold mb-4 px-2 ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        SideBar
      </h1>

      <div className="relative flex-1 overflow-hidden">
        {/* Scrollable content area */}
        <div className={`h-full overflow-y-auto pr-[1vw] scrollbar-custom`}>
          {tablesData.map((table) => (
            <SideBarEntries key={table.id} table={table} />
          ))}
        </div>

        {/* Bottom fade effect - only shows when scrolled */}
        <div
          className={`sticky bottom-0 left-0 right-0 h-6 ${
            theme === "dark"
              ? "bg-gradient-to-t from-gray-900 to-transparent"
              : "bg-gradient-to-t from-gray-50 to-transparent"
          } pointer-events-none`}
        />
      </div>
    </div>
  );
};

export default SideBar;
