// src/api/tableApi.ts
import { tokenUtils } from "./AuthApi";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, ""); // Remove trailing slash to avoid double slashes

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface TableDataType {
  id: number;
  table_name: string;
  description: string;
}

interface AddTableDataType {
  table_name: string;
  description: string;
}

interface UpdateTableRequest {
  id: number;
  table_name: string;
}

// API request helper with JWT authentication
const apiRequest = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  try {
    // Get JWT token for authentication
    const token = tokenUtils.getToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include", // Include cookies for JWT
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          errorData.error ||
          `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();

    // Handle different response formats from backend
    if (data.success !== undefined) {
      return { success: data.success, data: data.data, error: data.error };
    }

    // Handle Django response format: { message: "...", data: [...] }
    if (data.message && data.data !== undefined) {
      return { success: true, data: data.data };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

// Table API Service
export const tableApi = {
  // Get all tables - JWT authenticated
  async getTables(): Promise<ApiResponse<TableDataType[]>> {
    return apiRequest<TableDataType[]>("/main/tables/", "GET");
  },

  // Add a new table - JWT authenticated
  async addTable(
    tableData: AddTableDataType
  ): Promise<ApiResponse<TableDataType>> {
    return apiRequest<TableDataType>(
      "/main/create-tableContent/",
      "POST",
      tableData
    );
  },

  // Update a table - JWT authenticated
  async updateTable(
    updateData: UpdateTableRequest
  ): Promise<ApiResponse<TableDataType>> {
    return apiRequest<TableDataType>("/main/upadate-table/", "PUT", {
      id: updateData.id,
      table_name: updateData.table_name,
    });
  },

  // Delete a table - JWT authenticated (Demo - may not be working on backend)
  async deleteTable(id: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/main/tables/${id}/`, "DELETE");
  },

  // Share a table - JWT authenticated
  async shareTable(
    id: number,
    shareData?: { userIds: string[]; permission: string }
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(
      `/main/tables/${id}/share/`,
      "POST",
      shareData
    );
  },
};

// Updated action types to match new API
export type TableDataAction =
  | { type: "GET_TABLES" }
  | { type: "ADD_TABLE"; payload: AddTableDataType }
  | { type: "UPDATE_TABLE"; payload: UpdateTableRequest }
  | { type: "DELETE_TABLE"; payload: { id: number } }
  | {
      type: "SHARE_TABLE";
      payload: { id: number; userIds?: string[]; permission?: string };
    }
  // Add SET_TABLES for proper state management
  | { type: "SET_TABLES"; payload: TableDataType[] }
  | { type: "EDIT"; payload: { id: number; table_name: string } }
  | { type: "DELETE"; payload: { id: number } }
  | { type: "SHARE"; payload: { id: number } };

// Utility function to handle API calls and dispatch actions
export const handleTableOperation = async (
  action: TableDataAction,
  dispatch: React.Dispatch<any>, // You can type this better based on your reducer
  onSuccess?: (data?: any) => void,
  onError?: (error: string) => void
) => {
  try {
    switch (action.type) {
      case "GET_TABLES": {
        const response = await tableApi.getTables();

        if (response.success && response.data) {
          dispatch({
            type: "SET_TABLES",
            payload: response.data,
          });
          onSuccess?.(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch tables");
        }
        break;
      }

      case "ADD_TABLE": {
        const response = await tableApi.addTable(action.payload);

        if (response.success && response.data) {
          dispatch({
            type: "ADD_TABLE",
            payload: response.data,
          });
          onSuccess?.(response.data);
        } else {
          throw new Error(response.error || "Failed to add table");
        }
        break;
      }

      case "UPDATE_TABLE":
      case "EDIT": {
        const payload =
          action.type === "EDIT"
            ? { id: action.payload.id, table_name: action.payload.table_name }
            : action.payload;

        const response = await tableApi.updateTable(payload);

        if (response.success && response.data) {
          dispatch({
            type: "EDIT",
            payload: { id: payload.id, table_name: payload.table_name },
          });
          onSuccess?.(response.data);
        } else {
          throw new Error(response.error || "Failed to update table");
        }
        break;
      }

      case "DELETE_TABLE":
      case "DELETE": {
        const tableId =
          action.type === "DELETE" ? action.payload.id : action.payload.id;
        const response = await tableApi.deleteTable(tableId);

        if (response.success) {
          dispatch({
            type: "DELETE",
            payload: { id: tableId },
          });
          onSuccess?.();
        } else {
          throw new Error(response.error || "Failed to delete table");
        }
        break;
      }

      case "SHARE_TABLE":
      case "SHARE": {
        const tableId =
          action.type === "SHARE" ? action.payload.id : action.payload.id;
        const { userIds, permission } =
          action.type === "SHARE_TABLE"
            ? action.payload
            : { userIds: undefined, permission: undefined };
        const shareData =
          userIds && permission ? { userIds, permission } : undefined;
        const response = await tableApi.shareTable(tableId, shareData);

        if (response.success) {
          console.log("Table shared successfully!");
          dispatch({
            type: "SHARE",
            payload: { id: tableId },
          });
          onSuccess?.();
        } else {
          throw new Error(response.error || "Failed to share table");
        }
        break;
      }

      default:
        throw new Error("Unknown action type");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Operation failed";
    console.error("Table operation failed:", errorMessage);
    onError?.(errorMessage);
  }
};

// Export types
export type {
  TableDataType,
  AddTableDataType,
  UpdateTableRequest,
  ApiResponse,
};
