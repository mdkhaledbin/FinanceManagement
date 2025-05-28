import React from "react";
import { SlOptionsVertical } from "react-icons/sl";
import { TableDataType } from "@/data/table";
import { useTheme } from "@/context/ThemeProvider";

const SideBarEntries = ({ table }: { table: TableDataType }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`px-6 py-4 mb-3 rounded-xl transition-all duration-300 
      cursor-pointer group 
      ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-800/80 to-gray-900/90 hover:from-gray-700/80 hover:to-gray-800/90 border-gray-700/50"
          : "bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border-gray-200"
      }
      border hover:shadow-lg 
      hover:shadow-${theme === "dark" ? "gray-900/30" : "gray-200/80"}
      hover:-translate-y-0.5 hover:border-${
        theme === "dark" ? "gray-600/50" : "gray-300"
      }
      relative overflow-hidden
      after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent
      after:-translate-x-full after:group-hover:translate-x-full after:transition-transform after:duration-500`}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute inset-0 rounded-xl border-t ${
            theme === "dark" ? "border-t-gray-700/30" : "border-t-white/80"
          }`}
        ></div>
      </div>

      <div className="flex justify-between items-center mb-2 relative z-10">
        <h3
          className={`font-medium truncate max-w-[180px] text-[15px] ${
            theme === "dark"
              ? "text-gray-100 group-hover:text-white"
              : "text-gray-800 group-hover:text-gray-900"
          } transition-colors duration-200 flex items-center`}
        >
          {table.table_name}

          {table.pendingCount && (
            <span className="ml-2 flex items-center">
              <span
                className={`relative flex h-2 w-2 ${
                  theme === "dark" ? "bg-amber-400" : "bg-amber-500"
                } rounded-full`}
              >
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    theme === "dark" ? "bg-amber-400/80" : "bg-amber-500/80"
                  } animate-ping`}
                />
              </span>
              <span
                className={`ml-1 text-xs ${
                  theme === "dark" ? "text-amber-300" : "text-amber-700"
                }`}
              >
                {table.pendingCount}
              </span>
            </span>
          )}
        </h3>
        <button
          className={`p-1 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 
          ${
            theme === "dark"
              ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }
          transform translate-x-1 group-hover:translate-x-0
          backdrop-blur-sm`}
        >
          <SlOptionsVertical size={14} />
        </button>
      </div>

      <div className="flex justify-between text-sm gap-2 items-baseline relative z-10">
        <p
          className={`truncate max-w-[120px] text-[13px] transition-colors duration-200 ${
            theme === "dark"
              ? "text-gray-400 group-hover:text-gray-300"
              : "text-gray-500 group-hover:text-gray-600"
          }`}
        >
          {table.description && table.description.length > 20
            ? `${table.description.slice(0, 14)}...`
            : table.description || "\u00A0"}
        </p>
        <p
          className={`text-xs transition-colors duration-200 ${
            theme === "dark"
              ? "text-gray-500 group-hover:text-gray-400"
              : "text-gray-400 group-hover:text-gray-500"
          }`}
        >
          {new Date(table.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default SideBarEntries;
