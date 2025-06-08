// AuthApi.ts - Authentication API Service
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, ""); // Remove trailing slash to avoid double slashes

// Types for authentication
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SignInRequest {
  username: string;
  password: string;
}

interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  password2: string;
}

interface ResetPasswordRequest {
  email: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface ResetPasswordResponse {
  message: string;
}

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Authentication API Service
export const authApi = {
  // Sign in user
  async signIn(credentials: SignInRequest): Promise<ApiResponse<AuthUser>> {
    return apiRequest<AuthUser>("/auth/login/", "POST", credentials);
  },

  // Sign up user
  async signUp(userData: SignUpRequest): Promise<ApiResponse<AuthUser>> {
    return apiRequest<AuthUser>("/auth/register/", "POST", userData);
  },

  // Reset password
  async resetPassword(
    email: string
  ): Promise<ApiResponse<ResetPasswordResponse>> {
    return apiRequest<ResetPasswordResponse>("/auth/reset-password/", "POST", {
      email,
    });
  },

  // Sign out user (client-side token removal)
  async signOut(): Promise<void> {
    // Remove token from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
    }
  },
};

// Utility functions for token management
export const tokenUtils = {
  // Store user data and token
  storeAuth: (user: AuthUser) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", user.token);
      localStorage.setItem(
        "user_data",
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
        })
      );
    }
  },

  // Get stored token
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  },

  // Get stored user data
  getUser: (): { id: string; name: string; email: string } | null => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user_data");
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!tokenUtils.getToken();
  },

  // Clear stored auth data
  clearAuth: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
    }
  },
};

export type { SignInRequest, SignUpRequest, AuthUser, ApiResponse };
