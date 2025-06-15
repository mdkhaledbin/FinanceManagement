"use client";

import { useState, useEffect } from "react";
import {
  getUsersList,
  getFriendsList,
  manageFriend,
  getSelfDetail,
} from "@/api/AuthApi";
import Navbar from "@/components/Navbar";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Friend extends User {
  isFriend: boolean;
  added_by_me?: boolean;
  isMe?: boolean;
}

export default function UsersPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "friends">("all");
  const [showDummySidebar, setShowDummySidebar] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const response = await getSelfDetail();
      if (response.success && response.data) {
        setCurrentUser(response.data);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users first
      const usersResponse = await getUsersList();
      if (usersResponse.success && usersResponse.data) {
        const usersData = usersResponse.data;

        // Then fetch friends
        const friendsResponse = await getFriendsList();
        if (friendsResponse.success && friendsResponse.data) {
          const friendsList = friendsResponse.data.data || [];

          // Mark users as friends and set added_by_me status
          const usersWithFriendStatus = usersData.map((user: User) => {
            const friendInfo = friendsList.find(
              (friend: Friend) => friend.id === user.id
            );
            return {
              ...user,
              isFriend: !!friendInfo,
              added_by_me: friendInfo?.added_by_me,
              isMe: currentUser ? user.id === currentUser.id : false,
            };
          });

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

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const refetchUsers = () => {
    fetchData();
  };

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
        <Navbar isOpen={showDummySidebar} setIsOpen={setShowDummySidebar} />
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
      <Navbar isOpen={showDummySidebar} setIsOpen={setShowDummySidebar} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 mt-20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Users & Friends
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {activeTab === "friends"
                  ? "Manage your connections"
                  : "Discover new people"}
              </p>
            </div>
            <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  activeTab === "friends"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                My Friends
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6 shadow-sm transform transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {activeTab === "friends"
                    ? "No friends yet"
                    : "No users found"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {activeTab === "friends"
                    ? "Start adding friends to see them here"
                    : "Try adjusting your search or check back later"}
                </p>
                {activeTab === "all" && (
                  <button
                    onClick={() => refetchUsers()}
                    className="mt-4 px-4 py-2 bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Refresh Users
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <li
                    key={user.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center overflow-hidden">
                            <span className="text-xl font-medium text-blue-600 dark:text-blue-300">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {user.username}
                            {user.isMe && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                                me
                              </span>
                            )}
                            {user.isFriend && !user.isMe && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs rounded-full">
                                {user.added_by_me ? "Friend" : "Added you"}
                              </span>
                            )}
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
                        disabled={user.isFriend && !user.added_by_me}
                        className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 text-sm font-medium ${
                          user.isFriend
                            ? user.added_by_me
                              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                              : "bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        }`}
                      >
                        {user.isFriend ? (
                          <>
                            {user.added_by_me ? (
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
                            ) : (
                              ""
                            )}
                            <span>
                              {user.added_by_me ? "Remove" : "Added you"}
                            </span>
                          </>
                        ) : (
                          <>
                            {!user.isMe ? (
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
                                <span>Add Friend</span>
                              </>
                            ) : (
                              <span>You</span>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
