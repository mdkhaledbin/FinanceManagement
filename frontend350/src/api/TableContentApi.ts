// src/api/jsonTableApi.ts
import {
  JsonTableAction,
  CreateTablePayload,
} from "@/reducers/TableContentReducer";
import { JsonTableItem, TableData, TableRow } from "../data/TableContent";
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

interface CreateTableResponse {
  message: string;
  data: {
    id: number;
    table_name: string;
    headers: string[];
    created_at: string;
    description: string;
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

export const jsonTableApi = {
  // Get all tables
  async getTables(): Promise<ApiResponse<JsonTableItem[]>> {
    return apiRequest<JsonTableItem[]>("/main/table-contents/", "GET");
  },

  // Add a new table
  async addTable(
    payload: CreateTablePayload
  ): Promise<ApiResponse<JsonTableItem>> {
    return apiRequest<JsonTableItem>(
      "/main/create-tableContent/",
      "POST",
      payload
    );
  },

  // Delete a table
  async deleteTable(
    tableId: number
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(
      `/main/tables/${tableId}/`,
      "DELETE"
    );
  },

  // Add a row to a table
  async addRow(
    tableId: number,
    row: Omit<TableRow, "id">
  ): Promise<ApiResponse<TableRow>> {
    return apiRequest<TableRow>(`/main/add-row/`, "POST", {
      tableId,
      row,
    });
  },

  // Edit a row in a table
  async editRow(
    tableId: number,
    rowId: number | string,
    updates: Partial<TableRow>
  ): Promise<ApiResponse<TableRow>> {
    return apiRequest<TableRow>(`/main/update-row/`, "PATCH", {
      tableId,
      rowId,
      newRowData: updates,
    });
  },

  // Delete a row from a table
  async deleteRow(
    tableId: number,
    rowId: number | string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/main/delete-row/`, "POST", {
      tableId,
      rowId,
    });
  },

  // Update table headers
  async updateHeaders(
    tableId: number,
    headers: string[]
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/main/delete-column/`, "POST", {
      tableId,
      header: headers[headers.length - 1],
    });
  },

  // Add a column to a table
  async addColumn(
    tableId: number,
    header: string
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/main/add-column/`, "POST", {
      tableId,
      header,
    });
  },

  // Delete a column
  async deleteColumn(
    tableId: number,
    header: string
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/main/delete-column/`, "POST", {
      tableId,
      header,
    });
  },

  // Edit a header
  async editHeader(
    tableId: number,
    oldHeader: string,
    newHeader: string
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/main/edit-header/`, "POST", {
      tableId,
      oldHeader,
      newHeader,
    });
  },
};

// Utility function to handle API calls and dispatch actions
export const handleJsonTableOperation = async (
  action: JsonTableAction,
  dispatch: React.Dispatch<JsonTableAction>
) => {
  try {
    switch (action.type) {
      case "ADD_TABLE": {
        const response = await jsonTableApi.addTable(
          action.payload as CreateTablePayload
        );

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to add table");
        }

        console.log("TableContentApi - Raw Response:", response);
        console.log("TableContentApi - Response Data:", response.data);

        // Cast the response data to unknown first, then to CreateTableResponse
        const responseData = response.data as unknown as CreateTableResponse;
        const tableData: JsonTableItem = {
          id: responseData.data.id,
          data: {
            headers: responseData.data.headers,
            rows: [],
          },
        };

        console.log("TableContentApi - Converted Table Data:", tableData);

        dispatch({
          type: action.type,
          payload: tableData,
        });

        return response;
      }

      case "ADD_ROW": {
        const { tableId, row } = action.payload;
        const response = await jsonTableApi.addRow(tableId, row);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to add row");
        }

        console.log("Add Row Response:", response.data);

        // The backend returns { message: string, data: { id: number, ...rowData } }
        const responseData = response.data as unknown as {
          message: string;
          data: TableRow & { id: number };
        };

        dispatch({
          type: "ADD_ROW",
          payload: {
            tableId,
            row: responseData.data, // This now includes the row ID from the backend
          },
        });

        return response;
      }

      case "EDIT_ROW": {
        const { tableId, rowId, newRow } = action.payload;
        const response = await jsonTableApi.editRow(tableId, rowId, newRow);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to edit row");
        }

        dispatch(action);
        break;
      }

      case "DELETE_ROW": {
        const { tableId, rowId } = action.payload;
        const response = await jsonTableApi.deleteRow(tableId, rowId);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to delete row");
        }

        dispatch(action);
        break;
      }

      case "EDIT_TABLE_HEADERS": {
        const { tableId, headers } = action.payload;
        const response = await jsonTableApi.updateHeaders(tableId, headers);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to update headers");
        }

        dispatch(action);
        break;
      }

      case "DELETE_TABLE": {
        const { tableId } = action.payload;
        const response = await jsonTableApi.deleteTable(tableId);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to delete table");
        }

        dispatch(action);
        break;
      }

      case "ADD_COLUMN": {
        const { tableId, header } = action.payload;
        const response = await jsonTableApi.addColumn(tableId, header);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to add column");
        }

        dispatch(action);
        break;
      }

      case "EDIT_HEADER": {
        const { tableId, oldHeader, newHeader } = action.payload;
        const response = await jsonTableApi.editHeader(
          tableId,
          oldHeader,
          newHeader
        );

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to edit header");
        }

        dispatch(action);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Table operation failed:", error);
    throw error;
  }
};
