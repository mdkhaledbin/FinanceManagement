// src/api/tableApi.ts
import { getTableData, TableDataType } from "@/data/table";
import { TableDataAction } from "@/reducers/TableReducer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AddTableDataType {
  id: number;
  table_name: string;
  description: string;
}

const tableDataList = getTableData("1");

// Helper for mock API responses
function mockApiResponse<T>(
  endpoint: string,
  method: string,
  body?: unknown
): ApiResponse<T> {
  // GET /tables - Return all tables
  if (endpoint === "/tables" && method === "GET") {
    return { success: true, data: tableDataList as unknown as T };
  }

  // POST /tables - Add new table
  if (endpoint === "/tables" && method === "POST") {
    const newTable: TableDataType = {
      id: Math.max(0, ...tableDataList.map((t) => t.id)) + 1,
      ...(body as Omit<TableDataType, "id">),
    };
    tableDataList.push(newTable);
    return { success: true, data: newTable as unknown as T };
  }

  // PATCH /tables/:id - Edit table
  if (endpoint.match(/\/tables\/\d+$/) && method === "PATCH") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const table = tableDataList.find((t) => t.id === tableId);
    if (!table) return { success: false, error: "Table not found" };

    Object.assign(table, body);
    return { success: true, data: table as unknown as T };
  }

  // DELETE /tables/:id - Delete table
  if (endpoint.match(/\/tables\/\d+$/) && method === "DELETE") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const index = tableDataList.findIndex((t) => t.id === tableId);
    if (index === -1) return { success: false, error: "Table not found" };

    tableDataList.splice(index, 1);
    return { success: true, data: { success: true } as unknown as T };
  }

  // POST /tables/:id/share - Share table
  if (endpoint.match(/\/tables\/\d+\/share$/) && method === "POST") {
    // Placeholder logic for sharing (just returning success for now)
    return { success: true, data: { success: true } as unknown as T };
  }

  return {
    success: false,
    error: `Mock not implemented for ${method} ${endpoint}`,
  };
}

// API request helper (with mock option)
const apiRequest = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  const USE_MOCK_RESPONSES = true;

  if (USE_MOCK_RESPONSES) {
    return mockApiResponse<T>(endpoint, method, body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

// Table API Service
export const tableApi = {
  // Get all tables
  async getTables(): Promise<ApiResponse<TableDataType[]>> {
    return apiRequest<TableDataType[]>("/tables", "GET");
  },

  // Add a new table
  async addTable(
    tableData: Omit<AddTableDataType, "id">
  ): Promise<ApiResponse<TableDataType>> {
    return apiRequest<TableDataType>("/tables", "POST", tableData);
  },

  // Edit a table
  async editTable(
    id: number,
    updateData: { table_name: string }
  ): Promise<ApiResponse<TableDataType>> {
    return apiRequest<TableDataType>(`/tables/${id}`, "PATCH", updateData);
  },

  // Delete a table
  async deleteTable(id: number): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/tables/${id}`, "DELETE");
  },

  // Share a table
  async shareTable(
    id: number
    // shareData: { userIds: string[]; permission: string }
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(
      `/tables/${id}/share`,
      "POST"
      // shareData
    );
  },
};

// Utility function to handle API calls and dispatch actions
export const handleTableOperation = async (
  action: TableDataAction,
  dispatch: React.Dispatch<TableDataAction>
) => {
  try {
    switch (action.type) {
      case "ADD_TABLE": {
        const { id, ...tableData } = action.payload;
        const response = await tableApi.addTable(action.payload);

        if (response.error) throw new Error(response.error);

        dispatch({
          type: "ADD_TABLE",
          payload: {
            id: response.data?.id || id,
            table_name: response.data?.table_name || tableData.table_name,
            description: response.data?.description || tableData.description,
          },
        });
        break;
      }

      case "EDIT": {
        const response = await tableApi.editTable(action.payload.id, {
          table_name: action.payload.table_name,
        });

        if (response.error) throw new Error(response.error);

        dispatch(action);
        break;
      }

      case "DELETE": {
        const response = await tableApi.deleteTable(action.payload.id);

        if (response.error) throw new Error(response.error);

        dispatch(action);
        break;
      }

      case "SHARE": {
        const response = await tableApi.shareTable(action.payload.id);

        if (response.error) throw new Error(response.error);

        console.log("Table shared successfully!");
        // Optional: dispatch an action to update state
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Table operation failed:", error);
    // Consider dispatching an error action
  }
};
