"use client";
import React from "react";
import Image from "next/image";
import { LuSunDim } from "react-icons/lu";
import { HiMoon } from "react-icons/hi2";
import { useTheme } from "@/context/ThemeProvider";
import { HiMenu, HiX } from "react-icons/hi";

interface SideBarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Navbar = ({ isOpen, setIsOpen }: SideBarProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <nav
      className={`fixed top-0 left-0 w-full flex justify-between items-center h-16 md:h-20 px-4 sm:px-6 lg:px-8 z-50 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900 border-gray-800"
          : "bg-white border-gray-200"
      } border-b shadow-sm`}
    >
      {/* When sidebar is open, show toggle button first */}
      {isOpen ? (
        <div className="flex justify-between">
          <div
            className={`mr-10 w-32 md:w-40 lg:w-48 transition-transform hover:scale-105 ${
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
            className={`ml-10 p-2 rounded-lg transition-all duration-300 lg:hidden ${
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

      <div className="flex items-center space-x-4">
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
      </div>
    </nav>
  );
};

export default Navbar;
