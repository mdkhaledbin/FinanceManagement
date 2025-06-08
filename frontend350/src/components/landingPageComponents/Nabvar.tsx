import React, { useState } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { FiMenu, FiX, FiSun, FiMoon } from "react-icons/fi";
import clsx from "clsx";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const linkStyle = clsx(
    "font-medium transition-colors",
    theme === "dark"
      ? "text-gray-300 hover:text-white"
      : "text-gray-600 hover:text-blue-600"
  );

  return (
    <nav
      className={clsx(
        "w-full fixed top-0 z-50 shadow-sm transition-colors duration-300",
        theme === "dark" ? "bg-gray-900" : "bg-white"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div
            className={clsx(
              "text-3xl font-bold",
              theme === "dark" ? "text-white" : "text-blue-600"
            )}
          >
            FinBot
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#features" className={linkStyle}>
              Features
            </a>
            <a href="#why-us" className={linkStyle}>
              Why Us
            </a>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={clsx(
                "p-2 rounded-full transition-colors",
                theme === "dark" ? "text-yellow-400" : "text-blue-600"
              )}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            <a
              href="/Chat/"
              className={clsx(
                "px-6 py-2 rounded-md transition-colors font-medium",
                "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              MY EXPENSES
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={clsx(
                "p-2 rounded-full transition-colors",
                theme === "dark" ? "text-yellow-400" : "text-blue-600"
              )}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            <button
              onClick={toggleMobileMenu}
              className={clsx(
                "p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                theme === "dark"
                  ? "text-gray-300 hover:text-white focus:ring-gray-700"
                  : "text-gray-600 hover:text-blue-600 focus:ring-blue-300"
              )}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div
          className={clsx(
            "md:hidden px-4 pb-4 space-y-2 transition-all duration-300",
            theme === "dark"
              ? "bg-gray-900 text-gray-300"
              : "bg-white text-gray-700"
          )}
        >
          <a href="#features" className="block py-2 border-b border-gray-200">
            Features
          </a>
          <a href="#why-us" className="block py-2 border-b border-gray-200">
            Why Us
          </a>
          <a
            href="/Chat/"
            className={clsx(
              "block w-full text-center px-4 py-2 rounded-md font-medium mt-2",
              "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            MY EXPENSES
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
