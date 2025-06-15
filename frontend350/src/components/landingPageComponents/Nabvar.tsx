"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import {
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiSettings,
  FiUsers,
  FiMessageSquare,
  FiLogOut,
} from "react-icons/fi";
import clsx from "clsx";

import { useRouter, usePathname } from "next/navigation";
import SettingsModal from "@/components/SettingsModal";
import { useUser } from "@/context/AuthProvider";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useUser();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/signin");
    } else {
      router.push("/chat");
    }
  };

  const handleFriendsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/signin");
    } else {
      router.push("/users");
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname !== "/") {
      router.push("/");
    }
  };

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setShowUserMenu(false);
    router.push("/");
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
          <button
            onClick={handleLogoClick}
            className={clsx(
              "text-3xl font-bold",
              theme === "dark" ? "text-white" : "text-blue-600",
              pathname === "/"
                ? "cursor-default"
                : "cursor-pointer hover:opacity-80"
            )}
          >
            FinBot
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {!isLoggedIn ? (
              <>
                <a href="#features" className={linkStyle}>
                  Features
                </a>
                <a href="#why-us" className={linkStyle}>
                  Why Us
                </a>
                <button
                  onClick={() => router.push("/signin")}
                  className={clsx(
                    "px-6 py-2 rounded-md transition-colors font-medium",
                    "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                {/* Friends Link */}
                {pathname !== "/users" && (
                  <button
                    onClick={handleFriendsClick}
                    className={clsx("flex items-center space-x-1", linkStyle)}
                  >
                    <FiUsers size={18} />
                    <span>Friends</span>
                  </button>
                )}

                {/* Chat Link */}
                {pathname !== "/chat" && (
                  <button
                    onClick={handleChatClick}
                    className={clsx("flex items-center space-x-1", linkStyle)}
                  >
                    <FiMessageSquare size={18} />
                    <span>Chat</span>
                  </button>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={clsx(
                    "p-2 rounded-full transition-colors",
                    theme === "dark" ? "text-yellow-400" : "text-blue-600"
                  )}
                  aria-label="Toggle Theme"
                >
                  {theme === "dark" ? (
                    <FiSun size={20} />
                  ) : (
                    <FiMoon size={20} />
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={clsx(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300",
                      theme === "dark"
                        ? "bg-gray-800 text-white hover:bg-gray-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    )}
                  >
                    <span className="font-medium">
                      {user?.name || user?.username}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className={clsx(
                        "absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50",
                        theme === "dark"
                          ? "bg-gray-800 border border-gray-700"
                          : "bg-white border border-gray-200"
                      )}
                    >
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setShowUserMenu(false);
                        }}
                        className={clsx(
                          "flex items-center w-full px-4 py-2 text-sm",
                          theme === "dark"
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <FiSettings className="mr-3 h-4 w-4" />
                        Settings
                      </button>

                      <button
                        onClick={handleChatClick}
                        className={clsx(
                          "flex items-center w-full px-4 py-2 text-sm",
                          theme === "dark"
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <FiMessageSquare className="mr-3 h-4 w-4" />
                        Chat
                      </button>

                      <button
                        onClick={handleFriendsClick}
                        className={clsx(
                          "flex items-center w-full px-4 py-2 text-sm",
                          theme === "dark"
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <FiUsers className="mr-3 h-4 w-4" />
                        Friends
                      </button>

                      <button
                        onClick={handleSignOut}
                        className={clsx(
                          "flex items-center w-full px-4 py-2 text-sm",
                          theme === "dark"
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <FiLogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Theme Toggle */}
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

            {/* User Menu for Mobile */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={clsx(
                    "flex items-center space-x-2 px-3 py-2 rounded-lg",
                    theme === "dark"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-900"
                  )}
                >
                  <span className="font-medium">
                    {user?.name || user?.username}
                  </span>
                </button>

                {/* Mobile User Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className={clsx(
                      "absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50",
                      theme === "dark"
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                    )}
                  >
                    {/* Same dropdown menu items as desktop */}
                    <button
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setShowUserMenu(false);
                      }}
                      className={clsx(
                        "flex items-center w-full px-4 py-2 text-sm",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <FiSettings className="mr-3 h-4 w-4" />
                      Settings
                    </button>

                    <button
                      onClick={handleChatClick}
                      className={clsx(
                        "flex items-center w-full px-4 py-2 text-sm",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <FiMessageSquare className="mr-3 h-4 w-4" />
                      Chat
                    </button>

                    <button
                      onClick={handleFriendsClick}
                      className={clsx(
                        "flex items-center w-full px-4 py-2 text-sm",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <FiUsers className="mr-3 h-4 w-4" />
                      Friends
                    </button>

                    <button
                      onClick={handleSignOut}
                      className={clsx(
                        "flex items-center w-full px-4 py-2 text-sm",
                        theme === "dark"
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <FiLogOut className="mr-3 h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

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
          {!isLoggedIn ? (
            <>
              <a
                href="#features"
                className="block py-2 border-b border-gray-200"
              >
                Features
              </a>
              <a href="#why-us" className="block py-2 border-b border-gray-200">
                Why Us
              </a>
              <button
                onClick={() => router.push("/signin")}
                className={clsx(
                  "block w-full text-center px-4 py-2 rounded-md font-medium mt-2",
                  "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              {pathname !== "/users" && (
                <button
                  onClick={handleFriendsClick}
                  className="flex items-center space-x-2 py-2 border-b border-gray-200 w-full text-left"
                >
                  <FiUsers size={18} />
                  <span>Friends</span>
                </button>
              )}
              {pathname !== "/chat" && (
                <button
                  onClick={handleChatClick}
                  className="flex items-center space-x-2 py-2 border-b border-gray-200 w-full text-left"
                >
                  <FiMessageSquare size={18} />
                  <span>Chat</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
