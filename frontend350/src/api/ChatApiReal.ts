import { ChatMessage } from "@/data/ChatMessages";
import axios, {
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
  RawAxiosRequestHeaders,
} from "axios";
import { getCSRFToken } from "@/utils/csrf";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AgentStreamingResponse {
  success: boolean;
  message: string;
  query: string;
  response: string;
  formatted_response: string;
  raw_response: {
    messages: Array<
      Array<
        [
          string,
          {
            type: string;
            name: string;
            input: Record<string, unknown>;
          }
        ]
      >
    >;
  };
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token refresh functionality
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        await apiClient.get("/auth/updateAcessToken/");
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        const error =
          refreshError instanceof Error
            ? refreshError
            : new Error(String(refreshError));
        processQueue(error, null);

        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Add CSRF token to requests
apiClient.interceptors.request.use(
  (config) => {
    const csrfSafeMethod = /^(GET|HEAD|OPTIONS|TRACE)$/i;

    if (!csrfSafeMethod.test(config.method || "")) {
      const token = getCSRFToken();
      if (token) {
        config.headers["X-CSRFToken"] = token;
      }
    }

    // Add auth token if available
    const authToken = localStorage.getItem("auth_token");
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function for API requests
const apiRequest = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      url: endpoint,
      method,
      data: body,
      headers: headers
        ? ({
            ...apiClient.defaults.headers.common,
            ...headers,
          } as RawAxiosRequestHeaders)
        : (apiClient.defaults.headers.common as RawAxiosRequestHeaders),
    };

    const response: AxiosResponse<T> = await apiClient.request(config);
    return { success: true, data: response.data };
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      return {
        success: false,
        error:
          (axiosError.response.data as { message?: string })?.message ||
          `HTTP error! status: ${axiosError.response.status}`,
      };
    } else if (axiosError.request) {
      return {
        success: false,
        error: "No response received from server",
      };
    } else {
      return {
        success: false,
        error: axiosError.message || "An unknown error occurred",
      };
    }
  }
};

export const chatApi = {
  // Send a message and get bot response
  async sendMessage(
    message: ChatMessage,
    tableId?: string
  ): Promise<ApiResponse<ChatMessage>> {
    const requestBody: {
      query: string;
      table_id?: string;
      context_type?: string;
    } = {
      query: message.text,
    };

    if (tableId) {
      requestBody.table_id = tableId;
      requestBody.context_type = "table_context";
    }

    return apiRequest<ChatMessage>("/agent/streaming/", "POST", requestBody);
  },

  // Load chat history
  async loadChatHistory(): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const response = await apiRequest<ChatMessage[]>(
        "/main/chat-history/",
        "GET"
      );
      if (!response.success) {
        // If endpoint doesn't exist or fails, return empty array instead of error
        return {
          success: true,
          data: [],
        };
      }
      return response;
    } catch {
      // Return empty array on error instead of throwing
      return {
        success: true,
        data: [],
      };
    }
  },

  // Clear chat history
  async clearChatHistory(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await apiRequest<{ success: boolean }>(
        "/main/clear-chat/",
        "POST"
      );
    } catch {
      return {
        success: true,
        data: { success: true },
      };
    }
  },
};

// Utility function to handle chat operations
export const handleChatOperation = async (
  message: ChatMessage,
  tableId?: string,
  refreshData?: () => Promise<void>
): Promise<ChatMessage> => {
  try {
    const response = await chatApi.sendMessage(message, tableId);
    if (!response.success) {
      throw new Error(response.error || "Failed to send message");
    }

    const agentResponse = response.data as unknown as AgentStreamingResponse;

    // Create a new message object with the response data
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      text:
        agentResponse.formatted_response ||
        agentResponse.response ||
        "Sorry, I couldn't process your request.",
      sender: "bot",
      timestamp: new Date(),
      displayedText:
        agentResponse.formatted_response ||
        agentResponse.response ||
        "Sorry, I couldn't process your request.",
      agentData: {
        response: agentResponse.formatted_response || agentResponse.response,
        tools_called:
          agentResponse.raw_response.messages
            ?.filter((msg) => msg[0][1].type === "tool_use")
            .map((msg) => ({
              name: msg[0][1].name,
              args: msg[0][1].input,
            })) || [],
      },
    };

    // Refresh data if callback is provided
    if (refreshData) {
      await refreshData();
    }

    return botMessage;
  } catch {
    console.error("Chat operation failed");
    // Return a fallback message instead of throwing
    return {
      id: Date.now().toString(),
      text: "Sorry, I encountered an error while processing your request. Please make sure you're logged in and try again.",
      sender: "bot",
      timestamp: new Date(),
      displayedText:
        "Sorry, I encountered an error while processing your request. Please make sure you're logged in and try again.",
    };
  }
};
