"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, tokenUtils, AuthUser } from "@/api/AuthApi";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    username: string,
    email: string,
    password: string,
    password2: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const token = tokenUtils.getToken();
    const userData = tokenUtils.getUser();

    if (token && userData) {
      setUser({
        ...userData,
        token,
      });
    }

    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.signIn({ username, password });

      if (response.success && response.data) {
        setUser(response.data);
        tokenUtils.storeAuth(response.data);
        return { success: true };
      } else {
        return { success: false, error: response.error || "Sign in failed" };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    username: string,
    email: string,
    password: string,
    password2: string
  ) => {
    setLoading(true);
    try {
      const response = await authApi.signUp({
        username,
        email,
        password,
        password2,
      });

      if (response.success && response.data) {
        setUser(response.data);
        tokenUtils.storeAuth(response.data);
        return { success: true };
      } else {
        return { success: false, error: response.error || "Sign up failed" };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    tokenUtils.clearAuth();
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
