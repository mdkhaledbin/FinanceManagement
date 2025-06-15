// context/UserContext.tsx
"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import { getSelfDetail, updateAccessToken, logoutUser } from "@/api/AuthApi";
import { useRouter } from "next/navigation";

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  // Add other user fields as needed
}

export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes in milliseconds

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleTokenExpiration = useCallback(() => {
    // Remove all user-related data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("user_data");
    setUser(null);
    router.push("/signin");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const existingUser = localStorage.getItem("user");
    
    if (!existingUser && window.location.pathname !== "/signin") {
      setLoading(false);
      return;
    }

    try {
      const userData = await getSelfDetail();
      if (userData.success && userData.data) {
        localStorage.setItem("user", JSON.stringify(userData.data));
        setUser(userData.data);
      } else {
        throw new Error("User data is invalid");
      }
    } catch (error) {
      console.error("Failed to get user info:", error);
      handleTokenExpiration();
    } finally {
      setLoading(false);
    }
  }, [handleTokenExpiration]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await updateAccessToken();
      if (!response.success) {
        throw new Error("Failed to refresh token");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      handleTokenExpiration();
    }
  }, [handleTokenExpiration]);

  const signOut = useCallback(async () => {
    try {
      const response = await logoutUser();
      if (!response.success) {
        throw new Error(response.error || "Logout failed");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Always clear user data and redirect, even if the API call fails
      handleTokenExpiration();
    }
  }, [handleTokenExpiration]);

  // Initial user data fetch
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Periodic token refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [refreshToken]);

  return (
    <UserContext.Provider
      value={{ user, setUser, refreshUser, loading, signOut }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
