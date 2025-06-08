"use client";
import React, { useState } from "react";
import Image from "next/image";
import { LuSunDim } from "react-icons/lu";
import { HiMoon } from "react-icons/hi2";
import { HiMenu, HiX, HiLogout, HiUser } from "react-icons/hi";
import { useTheme } from "@/context/ThemeProvider";
import { useAuth } from "@/context/AuthProvider";

interface SideBarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Navbar = ({ isOpen, setIsOpen }: SideBarProps) => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full flex justify-between items-center h-16 md:h-20 px-4 sm:px-6 lg:px-8 z-[1010] transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 border-gray-800"
          : "bg-white border-gray-200"
      } border-b shadow-sm`}
    >
      {/* When sidebar is open, show toggle button first */}
      {isOpen ? (
        <div className="flex justify-between">
          <div
            className={`mr-12 w-32 md:w-40 lg:w-48 transition-transform hover:scale-105 ${
              isOpen ? "mx-auto" : ""
            }`}
          >
            <Image
              src="/image.png"
              alt="Logo"
              width={192}
              height={48}
              className="w-full h-auto"
              priority
            />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`ml-12 p-2 rounded-lg transition-all duration-300 lg:hidden ${
              theme === "dark"
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-50 text-gray-900 hover:bg-gray-100"
            } shadow-md border ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
            aria-label="Toggle menu"
          >
            <HiX size={22} className="transition-opacity" />
          </button>
        </div>
      ) : (
        <div className="flex">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-lg transition-all duration-300 lg:hidden ${
              theme === "dark"
                ? "bg-gray-800 text-white hover:bg-gray-700"
                : "bg-gray-50 text-gray-900 hover:bg-gray-100"
            } shadow-md border ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
            aria-label="Toggle menu"
          >
            <HiMenu size={22} className="transition-opacity" />
          </button>

          <div
            className={`w-32 md:w-40 lg:w-48 transition-transform hover:scale-105 ${
              isOpen ? "mx-auto" : ""
            }`}
          >
            <Image
              src="/image.png"
              alt="Logo"
              width={192}
              height={48}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`p-2 rounded-full transition-all duration-300 ${
            theme === "dark"
              ? "bg-gray-700 text-amber-300 hover:bg-gray-600"
              : "bg-gray-100 text-indigo-600 hover:bg-gray-200"
          } shadow-md flex items-center justify-center`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <LuSunDim
              size={20}
              className="transition-transform hover:rotate-12"
            />
          ) : (
            <HiMoon
              size={20}
              className="transition-transform hover:-rotate-12"
            />
          )}
        </button>

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              } shadow-md border ${
                theme === "dark" ? "border-gray-600" : "border-gray-200"
              }`}
              aria-label="User menu"
            >
              <HiUser size={18} />
              <span className="hidden sm:block text-sm font-medium">
                {user.name}
              </span>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } border z-50`}
              >
                <div className="py-1">
                  {/* User Info */}
                  <div
                    className={`px-4 py-3 border-b ${
                      theme === "dark" ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {user.name}
                    </p>
                    <p
                      className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {user.email}
                    </p>
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                      theme === "dark"
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <HiLogout className="mr-3 h-4 w-4" />
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
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
