"use client";

import { useState, useEffect } from "react";
import { getUsersList, getFriendsList, manageFriend } from "@/api/AuthApi";
import { useTheme } from "next-themes";
import Navbar from "@/components/landingPageComponents/Nabvar";

interface User {
  id: number;
  username: string;
  email: string;
}

interface Friend extends User {
  isFriend: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "friends">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users first
        const usersResponse = await getUsersList();
        if (usersResponse.success && usersResponse.data) {
          const usersData = usersResponse.data;
          setUsers(usersData);

          // Then fetch friends
          const friendsResponse = await getFriendsList();
          if (friendsResponse.success && friendsResponse.data) {
            const friendsList = friendsResponse.data.data || [];

            // Mark users as friends
            const usersWithFriendStatus = usersData.map((user: User) => ({
              ...user,
              isFriend: friendsList.some(
                (friend: User) => friend.id === user.id
              ),
            }));

            setFriends(usersWithFriendStatus);
          } else {
            setError(friendsResponse.error || "Failed to fetch friends");
          }
        } else {
          setError(usersResponse.error || "Failed to fetch users");
        }
      } catch (err) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFriendAction = async (
    userId: number,
    action: "add" | "remove"
  ) => {
    try {
      const response = await manageFriend({
        friend_id: userId,
        action: action,
      });

      if (response.success) {
        // Update friends list
        setFriends((prevFriends) =>
          prevFriends.map((friend) =>
            friend.id === userId
              ? { ...friend, isFriend: action === "add" }
              : friend
          )
        );
      } else {
        setError(response.error || `Failed to ${action} friend`);
      }
    } catch (err) {
      setError(`Failed to ${action} friend`);
      console.error(err);
    }
  };

  const filteredUsers =
    activeTab === "friends" ? friends.filter((user) => user.isFriend) : friends;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 mt-10 p-8 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
              Users & Friends
            </h1>
            <div className="flex space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-md">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === "all"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === "friends"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                My Friends
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg mb-6 shadow-sm">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {activeTab === "friends"
                      ? "No friends yet"
                      : "No users found"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-300 font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleFriendAction(
                          user.id,
                          user.isFriend ? "remove" : "add"
                        )
                      }
                      className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                        user.isFriend
                          ? "bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                          : "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                      }`}
                    >
                      {user.isFriend ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span>Remove</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
