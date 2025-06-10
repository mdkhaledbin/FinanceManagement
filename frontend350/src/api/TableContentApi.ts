// src/api/jsonTableApi.ts
import { JsonTableAction } from "@/reducers/TableContentReducer";
import { tokenUtils } from "./AuthApi";
import { JsonTableItem, TableData, TableRow } from "../data/TableContent";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Define the request structure for adding table with content
interface AddTableWithContentRequest {
  table_name: string;
  description: string;
  data: {
    headers: string[];
  };
}

// Helper function for API requests with JWT authentication
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

export const jsonTableApi = {
  // Get all table contents
  async getTables(): Promise<ApiResponse<JsonTableItem[]>> {
    return apiRequest<JsonTableItem[]>("/main/table-contents/", "GET");
  },

  // Add a new table with content structure
  async addTable(
    tableData: AddTableWithContentRequest
  ): Promise<ApiResponse<JsonTableItem>> {
    return apiRequest<JsonTableItem>(
      "/main/create-tableContent/",
      "POST",
      tableData
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
      tableId: tableId,
      row: row,
    });
  },

  // Edit a row in a table
  async editRow(
    tableId: number,
    rowId: number | string,
    updates: Partial<TableRow>
  ): Promise<ApiResponse<TableRow>> {
    return apiRequest<TableRow>(`/main/update-row/`, "PATCH", {
      table_id: tableId,
      row_id: rowId,
      new_row: updates,
    });
  },

  // Delete a row from a table
  async deleteRow(
    tableId: number,
    rowId: number | string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/main/delete-row/`, "POST", {
      tableId: tableId,
      rowId: rowId,
    });
  },

  // Delete a single column from a table
  async deleteColumn(
    tableId: number,
    header: string
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/main/delete-column/`, "POST", {
      tableId: tableId,
      header: header,
    });
  },

  // Add a column to a table
  async addColumn(
    tableId: number,
    header: string
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/main/add-column/`, "POST", {
      table_id: tableId,
      header,
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
        const { id, data } = action.payload;

        // Create the request in the format you specified
        const tableRequest: AddTableWithContentRequest = {
          table_name: `Table ${id}`,
          description: "New table",
          data: {
            headers: data.headers || ["id", "user_id", "action", "timestamp"],
          },
        };

        const response = await jsonTableApi.addTable(tableRequest);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to add table");
        }

        dispatch({
          type: "ADD_TABLE",
          payload: {
            id: response.data?.id || id,
            data: response.data?.data || data,
          },
        });
        break;
      }

      case "ADD_ROW": {
        const { tableId, row } = action.payload;
        const response = await jsonTableApi.addRow(tableId, row);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to add row");
        }

        dispatch({
          type: "ADD_ROW",
          payload: {
            tableId,
            row: response.data || row,
          },
        });
        break;
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
        // For single column deletion, we'll use the first header in the array
        const headerToDelete = headers[0];
        const response = await jsonTableApi.deleteColumn(
          tableId,
          headerToDelete
        );

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to delete column");
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

      case "DELETE_COLUMN": {
        const { tableId, header } = action.payload;
        const response = await jsonTableApi.deleteColumn(tableId, header);

        if (!response.success || response.error) {
          throw new Error(response.error || "Failed to delete column");
        }

        dispatch(action);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Table operation failed:", error);
    // Consider dispatching an error action here
  }
};

// Export the request type for use in other components
export type { AddTableWithContentRequest };
