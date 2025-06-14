"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { useUser } from "@/context/AuthProvider";
import { HiX, HiUser, HiMail, HiKey, HiSun, HiMoon } from "react-icons/hi";
import {
  getUserDetail,
  updateUserPassword,
  updateUserProfile,
  getSelfDetail,
} from "@/api/AuthApi";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Check if user is logged in
  const isLoggedIn = () => {
    return localStorage.getItem("user") !== null;
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (isOpen && user?.id) {
        setIsLoading(true);
        try {
          const response = await getUserDetail(user.id);
          if (response.success && response.data) {
            setFormData((prev) => ({
              ...prev,
              username: response.data.username || "",
              email: response.data.email || "",
            }));
          } else {
            setMessage({
              type: "error",
              text: response.error || "Failed to fetch user details",
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: `An error occurred while fetching user details: ${error}`,
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserDetails();
  }, [isOpen, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    if (!formData.currentPassword) {
      setMessage({
        type: "error",
        text: "Current password is required to update profile",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await updateUserProfile({
        email: formData.email,
        username: formData.username,
        password: formData.currentPassword,
      });

      if (response.success) {
        // Call getSelfDetail to update user data everywhere
        const userData = await getSelfDetail();
        if (userData.success && userData.data) {
          // Update localStorage with new user data
          localStorage.setItem("user", JSON.stringify(userData.data));
          // Update user context
          setUser(userData.data);
        }

        setMessage({
          type: "success",
          text: response.data.message || "Profile updated successfully",
        });
        // Clear password field
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
        }));
      } else {
        setMessage({
          type: "error",
          text: response.error || "Failed to update profile",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `An error occurred while updating profile: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await updateUserPassword({
        email: formData.email,
        username: formData.username,
        password: formData.currentPassword,
        newpassword: formData.newPassword,
        newpassword2: formData.confirmPassword,
      });

      if (response.success) {
        setMessage({
          type: "success",
          text: response.data.message || "Password updated successfully",
        });
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        setMessage({
          type: "error",
          text: response.error || "Failed to update password",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `An error occurred while updating password: ${error}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center w-screen h-screen">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4 rounded-xl shadow-2xl transition-all duration-300 ease-in-out transform ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        } ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === "dark" ? "border-gray-800" : "border-gray-200"
          }`}
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-300 ${
              theme === "dark"
                ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
            }`}
          >
            <HiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {isLoggedIn() ? (
            <>
              {/* Tabs */}
              <div
                className={`flex border-b ${
                  theme === "dark" ? "border-gray-800" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex-1 py-4 text-center font-medium transition-all duration-300 ${
                    activeTab === "profile"
                      ? theme === "dark"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent border-b-2 border-blue-500"
                        : "bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent border-b-2 border-blue-600"
                      : theme === "dark"
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`flex-1 py-4 text-center font-medium transition-all duration-300 ${
                    activeTab === "security"
                      ? theme === "dark"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent border-b-2 border-blue-500"
                        : "bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent border-b-2 border-blue-600"
                      : theme === "dark"
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Security
                </button>
              </div>

              {/* Profile and Security Forms */}
              {activeTab === "profile" ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Username
                      </label>
                      <div className="relative">
                        <div
                          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <HiUser size={20} />
                        </div>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Email
                      </label>
                      <div className="relative">
                        <div
                          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <HiMail size={20} />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Current Password
                      </label>
                      <div className="relative">
                        <div
                          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <HiKey size={20} />
                        </div>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          required
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Theme
                      </label>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                          theme === "dark"
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {theme === "dark" ? (
                          <>
                            <HiSun size={20} className="text-amber-400" />
                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                              Light Mode
                            </span>
                          </>
                        ) : (
                          <>
                            <HiMoon size={20} className="text-indigo-600" />
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                              Dark Mode
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? "Updating..." : "Update Profile"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Current Password
                      </label>
                      <div className="relative">
                        <div
                          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <HiKey size={20} />
                        </div>
                        <input
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        New Password
                      </label>
                      <div className="relative">
                        <div
                          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <HiKey size={20} />
                        </div>
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div
                          className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          <HiKey size={20} />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-all duration-300 ${
                            theme === "dark"
                              ? "bg-gray-800 border-gray-700 focus:border-blue-500"
                              : "bg-gray-50 border-gray-200 focus:border-blue-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </>
          ) : (
            // Only show theme toggle for non-logged in users
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Theme
                </label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    theme === "dark"
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {theme === "dark" ? (
                    <>
                      <HiSun size={20} className="text-amber-400" />
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                        Light Mode
                      </span>
                    </>
                  ) : (
                    <>
                      <HiMoon size={20} className="text-indigo-600" />
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Dark Mode
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
