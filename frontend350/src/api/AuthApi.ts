/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { getCSRFToken } from "@/utils/csrf";

// Set base URL for the backend
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"; // Replace with your actual backend URL

// Enable credentials (cookies like access_token and refresh_token)
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  // Only add CSRF header to unsafe methods
  const csrfSafeMethod = /^(GET|HEAD|OPTIONS|TRACE)$/i;

  if (!csrfSafeMethod.test(config.method || "")) {
    const token = getCSRFToken();
    if (token) {
      config.headers["X-CSRFToken"] = token;
    }
  }

  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired and it's the first retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Refresh the token
        await axiosInstance.get("/auth/updateAcessToken/");
        processQueue(null);
        return axiosInstance(originalRequest); // Retry original request
      } catch (refreshError) {
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Interfaces
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface UpdateUserPasswordData {
  email?: string;
  username?: string;
  password: string;
  newpassword: string;
  newpassword2: string;
}

// API Calls

export const registerUser = async (data: RegisterData) => {
  const response = await axiosInstance.post("/auth/register/", data);
  console.log(response.data);
  return response.data;
};

export const loginUser = async (data: LoginData) => {
  const response = await axiosInstance.post("/auth/login/", data);
  console.log(response.data);
  return response.data;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post("/auth/logout/");
  return response.data;
};

export const getUsersList = async () => {
  const response = await axiosInstance.get("/auth/users-list/");
  return response.data;
};

export const getUserDetail = async (userId: number) => {
  const response = await axiosInstance.get(`/auth/users-list/${userId}/`);
  return response.data;
};

export const updateUserPassword = async (data: UpdateUserPasswordData) => {
  const response = await axiosInstance.post("/auth/update", data);
  return response.data;
};

export const updateAccessToken = async () => {
  const response = await axiosInstance.get("/auth/updateAcessToken/");
  return response.data;
};

export const getSelfDetail = async () => {
  const response = await axiosInstance.get("/auth/me/");
  return response.data;
};
