// SideBarEntries.jsx
import React, { useState, useRef, useEffect } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import { TableDataType } from "@/data/table";
import { useTheme } from "@/context/ThemeProvider";
import { createPortal } from "react-dom";

interface SideBarEntriesProps {
  table: TableDataType;
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onShare: (id: number) => void;
  isActive: boolean; // New prop to control active state
  onSetActive: (id: number | null) => void; // New prop to set active state
}

const SideBarEntries: React.FC<SideBarEntriesProps> = ({
  table,
  onEdit,
  onDelete,
  onShare,
  isActive,
  onSetActive,
}) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(table.table_name);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const handleClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        if (isEditing) {
          // If editing, save changes (same as pressing Enter)
          onEdit(table.id, editedName);
        }
        onSetActive(null);
        setIsEditing(false);
      }
    },
    [isEditing, onEdit, table.id, editedName, onSetActive]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleEditClick = () => {
    setIsEditing(true);
    onSetActive(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameBlur = () => {
    onEdit(table.id, editedName);
    setIsEditing(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: number,
    name: string
  ) => {
    if (e.key === "Enter") {
      onEdit(id, name);
      setIsEditing(false);
    }
  };

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const isTopHalf = buttonRect.top < viewportHeight / 2;

      setDropdownPosition({
        left: buttonRect.right + window.scrollX - 10, // 10px offset from the button
        top: isTopHalf
          ? buttonRect.bottom + window.scrollY + 5 // Show below if in top half
          : buttonRect.top + window.scrollY - 130, // Show above if in bottom half (130px is approx dropdown height)
      });
    }
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isActive) {
      onSetActive(null);
    } else {
      calculateDropdownPosition();
      onSetActive(table.id);
    }
  };

  const handleEntryClick = () => {
    onSetActive(table.id);
  };
  const isDropdownOpen = isActive;

  // Update position on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isDropdownOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isDropdownOpen]);

  return (
    <div
      className={`px-1 sm:px-2 lg:px-3 py-3 sm:py-4 mb-2 sm:mb-3 rounded-lg sm:rounded-xl transition-all duration-300 
        cursor-pointer group 
        ${
          theme === "dark"
            ? isActive
              ? "bg-gradient-to-br from-gray-700/80 to-gray-800/90 border-gray-600/50"
              : "bg-gradient-to-br from-gray-800/80 to-gray-900/90 hover:from-gray-700/80 hover:to-gray-800/90 border-gray-700/50"
            : isActive
            ? "bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300"
            : "bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 border-gray-200"
        }
        border hover:shadow-lg 
        hover:shadow-${theme === "dark" ? "gray-900/30" : "gray-200/80"}
        hover:-translate-y-0.5 hover:border-${
          theme === "dark" ? "gray-600/50" : "gray-300"
        }
        relative overflow-hidden
        after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent
        after:-translate-x-full ${
          isActive
            ? "after:translate-x-full"
            : "group-hover:after:translate-x-full"
        } after:transition-transform after:duration-500`}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute inset-0 rounded-lg sm:rounded-xl border-t ${
            theme === "dark" ? "border-t-gray-700/30" : "border-t-white/80"
          }`}
        ></div>
      </div>

      <div className="flex justify-between items-center mb-1 sm:mb-2 relative z-10">
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={(e) => handleKeyDown(e, table.id, editedName)}
            autoFocus
            className={`bg-transparent border-b ${
              theme === "dark"
                ? "text-white border-gray-500 focus:border-gray-300"
                : "text-gray-900 border-gray-300 focus:border-gray-500"
            } outline-none w-full`}
          />
        ) : (
          <h3
            className={`font-medium truncate text-sm sm:text-[15px] ${
              theme === "dark"
                ? "text-gray-100 group-hover:text-white"
                : "text-gray-800 group-hover:text-gray-900"
            } transition-colors duration-200 flex items-center
            w-[90%]`}
          >
            <p className="inline-flex items-center">
              {table.table_name}
              {table.pendingCount > 0 && (
                <span className="ml-1 sm:ml-2 inline-flex items-center">
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 ${
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
                    className={`ml-0.5 sm:ml-1 text-xs ${
                      theme === "dark" ? "text-amber-300" : "text-amber-700"
                    }`}
                  >
                    {table.pendingCount}
                  </span>
                </span>
              )}
            </p>
          </h3>
        )}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={(e) => {
              handleDropdownToggle(e);
              handleEntryClick();
            }}
            className={`p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all duration-200 ${
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } 
            ${
              theme === "dark"
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }
            transform ${
              isActive
                ? "translate-x-0"
                : "translate-x-1 group-hover:translate-x-0"
            }
            backdrop-blur-sm`}
          >
            <SlOptionsVertical size={12} className="sm:w-3.5 sm:h-3.5" />
          </button>

          {isDropdownOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                className={`fixed z-[1000] w-40 rounded-md shadow-lg ${
                  theme === "dark"
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                }}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleEditClick();
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      theme === "dark"
                        ? "text-gray-200 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onShare(table.id);
                      onSetActive(null);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      theme === "dark"
                        ? "text-gray-200 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      onDelete(table.id);
                      onSetActive(null);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      theme === "dark"
                        ? "text-red-400 hover:bg-gray-700"
                        : "text-red-600 hover:bg-gray-100"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>,
              document.body
            )}
        </div>
      </div>

      <div className="flex justify-between text-sm gap-1 sm:gap-2 items-baseline relative z-10">
        <p
          className={`truncate text-xs sm:text-[13px] transition-colors duration-200 ${
            theme === "dark"
              ? "text-gray-400 group-hover:text-gray-300"
              : "text-gray-500 group-hover:text-gray-600"
          } max-w-[80px] xs:max-w-[100px] sm:max-w-[120px]`}
        >
          {table.description || "\u00A0"}
        </p>
        <p
          className={`text-xs transition-colors duration-200 flex-shrink-0 ${
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
