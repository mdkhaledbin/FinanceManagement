"use client";
import React, { useState } from "react";
import Image from "next/image";
import { LuSunDim } from "react-icons/lu";
import { HiMoon } from "react-icons/hi2";
import {
  HiMenu,
  HiX,
  HiLogout,
  HiUser,
  HiCog,
  HiUserGroup,
  HiChat,
} from "react-icons/hi";
import { useTheme } from "@/context/ThemeProvider";
import { useUser } from "@/context/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import SettingsModal from "./SettingsModal";
import { createPortal } from "react-dom";

interface SideBarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Navbar = ({ isOpen, setIsOpen }: SideBarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
  };

  const handleFriendsClick = () => {
    router.push("/users");
  };

  const handleChatClick = () => {
    router.push("/chat");
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full flex justify-between items-center h-16 md:h-20 px-4 sm:px-6 lg:px-8 z-[1010] transition-all duration-500 ease-in-out ${
          theme === "dark"
            ? "bg-gray-900/95 backdrop-blur-sm border-gray-800"
            : "bg-white/95 backdrop-blur-sm border-gray-200"
        } border-b shadow-lg`}
      >
        {/* When sidebar is open, show toggle button first */}
        {isOpen ? (
          <div className="flex justify-between">
            <div
              onClick={() => router.push("/")}
              className={`mr-12 w-32 md:w-40 lg:w-48 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer ${
                isOpen ? "mx-auto" : ""
              }`}
            >
              <Image
                src="/image.png"
                alt="Logo"
                width={192}
                height={48}
                className="w-full h-auto transition-opacity duration-500"
                priority
              />
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`ml-12 p-2 rounded-lg transition-all duration-500 ease-in-out lg:hidden ${
                theme === "dark"
                  ? "bg-gray-800/80 text-white hover:bg-gray-700 hover:scale-105"
                  : "bg-gray-50/80 text-gray-900 hover:bg-gray-100 hover:scale-105"
              } shadow-lg border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
              aria-label="Toggle menu"
            >
              <HiX
                size={22}
                className="transition-all duration-500 ease-in-out"
              />
            </button>
          </div>
        ) : (
          <div className="flex">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-all duration-500 ease-in-out lg:hidden ${
                theme === "dark"
                  ? "bg-gray-800/80 text-white hover:bg-gray-700 hover:scale-105"
                  : "bg-gray-50/80 text-gray-900 hover:bg-gray-100 hover:scale-105"
              } shadow-lg border ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
              aria-label="Toggle menu"
            >
              <HiMenu
                size={22}
                className="transition-all duration-500 ease-in-out"
              />
            </button>

            <div
              onClick={() => router.push("/")}
              className={`w-32 md:w-40 lg:w-48 transition-all duration-500 ease-in-out hover:scale-105 cursor-pointer ${
                isOpen ? "mx-auto" : ""
              }`}
            >
              <Image
                src="/image.png"
                alt="Logo"
                width={192}
                height={48}
                className="w-full h-auto transition-opacity duration-500"
                priority
              />
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Chat Button */}
          {pathname !== "/chat" && (
            <button
              onClick={handleChatClick}
              className={`p-2 rounded-full transition-all duration-500 ease-in-out ${
                theme === "dark"
                  ? "bg-gray-700/80 text-white hover:bg-gray-600 hover:scale-110"
                  : "bg-gray-100/80 text-gray-900 hover:bg-gray-200 hover:scale-110"
              } shadow-lg flex items-center justify-center`}
              aria-label="Chat"
            >
              <HiChat
                size={20}
                className="transition-all duration-500 ease-in-out hover:rotate-12"
              />
            </button>
          )}

          {/* Friends Button */}
          {pathname !== "/users" && (
            <button
              onClick={handleFriendsClick}
              className={`p-2 rounded-full transition-all duration-500 ease-in-out ${
                theme === "dark"
                  ? "bg-gray-700/80 text-white hover:bg-gray-600 hover:scale-110"
                  : "bg-gray-100/80 text-gray-900 hover:bg-gray-200 hover:scale-110"
              } shadow-lg flex items-center justify-center`}
              aria-label="Friends"
            >
              <HiUserGroup
                size={20}
                className="transition-all duration-500 ease-in-out hover:rotate-12"
              />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => toggleTheme()}
            className={`p-2 rounded-full transition-all duration-500 ease-in-out ${
              theme === "dark"
                ? "bg-gray-700/80 text-amber-300 hover:bg-gray-600 hover:scale-110"
                : "bg-gray-100/80 text-indigo-600 hover:bg-gray-200 hover:scale-110"
            } shadow-lg flex items-center justify-center`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <LuSunDim
                size={20}
                className="transition-all duration-500 ease-in-out hover:rotate-45"
              />
            ) : (
              <HiMoon
                size={20}
                className="transition-all duration-500 ease-in-out hover:-rotate-45"
              />
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-500 ease-in-out ${
                  theme === "dark"
                    ? "bg-gray-700/80 text-white hover:bg-gray-600 hover:scale-105"
                    : "bg-gray-100/80 text-gray-900 hover:bg-gray-200 hover:scale-105"
                } shadow-lg border ${
                  theme === "dark" ? "border-gray-600" : "border-gray-200"
                }`}
                aria-label="User menu"
              >
                <HiUser
                  size={18}
                  className="transition-all duration-500 ease-in-out"
                />
                <span className="hidden sm:block text-sm font-medium transition-all duration-500 ease-in-out">
                  {user.name || user.username}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl transition-all duration-500 ease-in-out transform origin-top-right ${
                    theme === "dark"
                      ? "bg-gray-800/95 backdrop-blur-sm border-gray-700"
                      : "bg-white/95 backdrop-blur-sm border-gray-200"
                  } border z-50`}
                >
                  <div className="py-1">
                    {/* User Info */}
                    <div
                      className={`px-4 py-3 border-b transition-colors duration-500 ease-in-out ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium transition-colors duration-500 ease-in-out ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {user.name || user.username}
                      </p>
                      <p
                        className={`text-xs transition-colors duration-500 ease-in-out ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {user.email}
                      </p>
                    </div>

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center px-4 py-2 text-sm transition-all duration-500 ease-in-out ${
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <HiCog className="mr-3 h-4 w-4 transition-transform duration-500 ease-in-out hover:rotate-45" />
                      Settings
                    </button>

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className={`w-full flex items-center px-4 py-2 text-sm transition-all duration-500 ease-in-out ${
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <HiLogout className="mr-3 h-4 w-4 transition-transform duration-500 ease-in-out hover:rotate-12" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40 transition-opacity duration-500 ease-in-out"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </nav>

      {/* Settings Modal */}
      {typeof window !== "undefined" &&
        createPortal(
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => {
              setTimeout(() => {
                setShowSettingsModal(false);
              }, 300);
            }}
          />,
          document.body
        )}
    </>
  );
};

export default Navbar;
