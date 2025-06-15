// SideBarEntries.jsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import { IoShareOutline } from "react-icons/io5";
import { BsShareFill } from "react-icons/bs";
import { TableDataType } from "@/data/table";
import { useTheme } from "@/context/ThemeProvider";
import { createPortal } from "react-dom";
import { useSelectedTable } from "@/context/SelectedTableProvider";
import { tableApi } from "@/api/TableDataApi";
import { getFriendsList } from "@/api/AuthApi";
import { useTablesData } from "@/context/DataProviderReal";

interface Friend {
  id: number;
  username: string;
  email: string;
}

interface SideBarEntriesProps {
  table: TableDataType;
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

const SideBarEntries: React.FC<SideBarEntriesProps> = ({
  table,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();
  const { selectedTable, setSelectedTable } = useSelectedTable();
  const { dispatchTablesData } = useTablesData();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(table.table_name);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [showDropDown, setShowDropDown] = useState(false);
  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false);
  const friendsDropdownRef = useRef<HTMLDivElement>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    }
  }, []);

  const handleSelectTable = (tableId: number | null) => {
    console.log("SideBarEntries - Table ID:", tableId);
    console.log("SideBarEntries - Current Table:", table);
    console.log("SideBarEntries - Selected Table State:", selectedTable);
    setSelectedTable(tableId);
  };

  const handleClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !friendsDropdownRef.current
      ) {
        setShowDropDown(false);
        setShowFriendsDropdown(false);
        setIsEditing(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        friendsDropdownRef.current &&
        !friendsDropdownRef.current.contains(event.target as Node)
      ) {
        if (isEditing) {
          onEdit(table.id, editedName);
        }
        setShowDropDown(false);
        setShowFriendsDropdown(false);
        setIsEditing(false);
      }
    },
    [isEditing, onEdit, table.id, editedName]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

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

    setShowDropDown(!showDropDown);
    if (!showDropDown) {
      calculateDropdownPosition();
    }
  };

  // Update position on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showDropDown) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [showDropDown]);

  // Sync scroll position with main dropdown
  useEffect(() => {
    const handleScroll = () => {
      if (showDropDown && showFriendsDropdown && dropdownRef.current) {
        const mainDropdownRect = dropdownRef.current.getBoundingClientRect();
        if (friendsDropdownRef.current) {
          friendsDropdownRef.current.style.top = `${
            mainDropdownRect.bottom + window.scrollY + 5
          }px`;
          friendsDropdownRef.current.style.left = `${mainDropdownRect.left}px`;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [showDropDown, showFriendsDropdown]);

  const handleShare = async () => {
    if (selectedFriends.length === 0) return;

    setLoading(true);
    try {
      const response = await tableApi.shareTable({
        table_id: table.id,
        friend_ids: selectedFriends,
        action: "share",
      });

      if (response.success && response.data?.table) {
        dispatchTablesData({
          type: "SHARE",
          payload: {
            id: table.id,
            is_shared: response.data.table.is_shared,
            shared_with: response.data.table.shared_with,
          },
        });
        setShowFriendsDropdown(false);
        setShowDropDown(false);
      } else {
        setError(response.error || "Failed to share table");
      }
    } catch {
      setError("Failed to share table");
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async () => {
    if (selectedFriends.length === 0) return;

    setLoading(true);
    try {
      const response = await tableApi.shareTable({
        table_id: table.id,
        friend_ids: selectedFriends,
        action: "unshare",
      });

      if (response.success && response.data?.table) {
        dispatchTablesData({
          type: "SHARE",
          payload: {
            id: table.id,
            is_shared: response.data.table.is_shared,
            shared_with: response.data.table.shared_with,
          },
        });
        setShowFriendsDropdown(false);
        setShowDropDown(false);
        if (selectedTable === table.id) handleSelectTable(null);
      } else {
        setError(response.error || "Failed to unshare table");
      }
    } catch {
      setError("Failed to unshare table");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await getFriendsList();
        if (response.success && response.data?.data) {
          setFriends(response.data.data);
        }
      } catch {
        setError("Failed to fetch friends");
      }
    };

    if (showFriendsDropdown) {
      fetchFriends();
    }
  }, [showFriendsDropdown]);

  return (
    <div
      className={`px-1 sm:px-2 lg:px-3 py-3 sm:py-4 mb-2 sm:mb-3 rounded-lg sm:rounded-xl transition-all duration-500 ease-in-out 
        cursor-pointer group 
        ${
          theme === "dark"
            ? selectedTable === table.id
              ? "bg-gradient-to-br from-gray-700/90 to-gray-800/95 border-gray-600/50"
              : "bg-gradient-to-br from-gray-800/90 to-gray-900/95 hover:from-gray-700/90 hover:to-gray-800/95 border-gray-700/50"
            : selectedTable === table.id
            ? "bg-gradient-to-br from-gray-100/95 to-gray-50/95 border-gray-300"
            : "bg-gradient-to-br from-gray-50/95 to-white/95 hover:from-gray-100/95 hover:to-gray-50/95 border-gray-200"
        }
        border hover:shadow-lg 
        hover:shadow-${theme === "dark" ? "gray-900/30" : "gray-200/80"}
        hover:-translate-y-0.5 hover:border-${
          theme === "dark" ? "gray-600/50" : "gray-300"
        }
        relative overflow-hidden
        after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent
        after:-translate-x-full ${
          selectedTable === table.id
            ? "after:translate-x-full"
            : "group-hover:after:translate-x-full"
        } after:transition-transform after:duration-500`}
      onClick={() => handleSelectTable(table.id)}
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
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={() => {
              onEdit(table.id, editedName);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEdit(table.id, editedName);
                setIsEditing(false);
              }
            }}
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
                ? "bg-gradient-to-r from-gray-100 to-white bg-clip-text text-transparent group-hover:from-white group-hover:to-gray-100"
                : "bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent group-hover:from-gray-900 group-hover:to-gray-800"
            } transition-colors duration-500 ease-in-out flex items-center
            w-[90%]`}
          >
            <p className="inline-flex flex-col">
              {table.is_shared && (
                <span
                  className={`text-[10px] sm:text-xs mb-0.5 flex items-center gap-1 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {currentUserId === table.owner.id ? (
                    <>
                      <IoShareOutline
                        className={`${
                          theme === "dark"
                            ? "text-emerald-400"
                            : "text-emerald-600"
                        }`}
                      />
                      Shared
                    </>
                  ) : (
                    <>
                      <BsShareFill
                        className={`${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                      Shared from {table.owner.username}
                    </>
                  )}
                </span>
              )}
              <span
                className={`font-semibold tracking-wide ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                }`}
              >
                {table.table_name}
              </span>
            </p>
          </h3>
        )}
        <div className="relative">
          {currentUserId === table.owner.id && (
            <button
              ref={buttonRef}
              onClick={(e) => {
                handleDropdownToggle(e);
              }}
              className={`p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all duration-500 ease-in-out ${
                selectedTable === table.id
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } 
              ${
                theme === "dark"
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }
              transform ${
                selectedTable === table.id
                  ? "translate-x-0"
                  : "translate-x-1 group-hover:translate-x-0"
              }
              backdrop-blur-sm`}
            >
              <SlOptionsVertical size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          {showDropDown &&
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setShowDropDown(false);
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFriendsDropdown(true);
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(table.id);
                      setShowDropDown(false);
                      if (selectedTable === table.id) handleSelectTable(null);
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
          className={`truncate text-xs sm:text-[13px] transition-colors duration-500 ease-in-out ${
            theme === "dark"
              ? "text-gray-400 group-hover:text-gray-300"
              : "text-gray-500 group-hover:text-gray-600"
          } max-w-[80px] xs:max-w-[100px] sm:max-w-[120px]`}
        >
          {table.description || "\u00A0"}
        </p>
        <p
          className={`text-xs transition-colors duration-500 ease-in-out flex-shrink-0 ${
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

      {showFriendsDropdown &&
        createPortal(
          <div
            ref={friendsDropdownRef}
            className={`fixed z-[1001] w-64 rounded-xl shadow-xl backdrop-blur-sm ${
              theme === "dark"
                ? "bg-gray-800/95 border border-gray-700/50"
                : "bg-white/95 border border-gray-200/50"
            }`}
            style={{
              top: `${dropdownPosition.top + 80}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <div className="p-3">
              <div
                className={`px-2 py-1.5 text-sm font-medium mb-2 ${
                  theme === "dark"
                    ? "text-gray-300 bg-gradient-to-r from-gray-700/50 to-gray-800/50"
                    : "text-gray-700 bg-gradient-to-r from-gray-100/50 to-gray-50/50"
                } rounded-lg`}
              >
                Share with friends
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`flex items-center p-2 rounded-lg mb-1 transition-all duration-200 ${
                      theme === "dark"
                        ? "hover:bg-gray-700/50"
                        : "hover:bg-gray-100/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`friend-${friend.id}`}
                      checked={selectedFriends.includes(friend.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFriends([...selectedFriends, friend.id]);
                        } else {
                          setSelectedFriends(
                            selectedFriends.filter((id) => id !== friend.id)
                          );
                        }
                      }}
                      className={`w-4 h-4 rounded border-2 ${
                        theme === "dark"
                          ? "border-gray-600 checked:bg-blue-500"
                          : "border-gray-300 checked:bg-blue-500"
                      } transition-colors duration-200`}
                    />
                    <label
                      htmlFor={`friend-${friend.id}`}
                      className={`ml-2 text-sm cursor-pointer ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <span className="font-medium">{friend.username}</span>
                      <span
                        className={`text-xs ml-1 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        ({friend.email})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-3 pt-2 border-t border-gray-200/50">
                <button
                  onClick={handleUnshare}
                  disabled={loading || selectedFriends.length === 0}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 
                    ${
                      loading || selectedFriends.length === 0
                        ? theme === "dark"
                          ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200/50 text-gray-400 cursor-not-allowed"
                        : theme === "dark"
                        ? "bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white"
                        : "bg-gradient-to-r from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white"
                    }`}
                >
                  Unshare
                </button>
                <button
                  onClick={handleShare}
                  disabled={loading || selectedFriends.length === 0}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 
                    ${
                      loading || selectedFriends.length === 0
                        ? theme === "dark"
                          ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200/50 text-gray-400 cursor-not-allowed"
                        : theme === "dark"
                        ? "bg-gradient-to-r from-blue-500/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-600 text-white"
                        : "bg-gradient-to-r from-blue-500/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-600 text-white"
                    }`}
                >
                  Share
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="relative">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBarEntries;
