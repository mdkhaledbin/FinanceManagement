// src/api/jsonTableApi.ts
import { JsonTableAction } from "@/reducers/TableContentReducer";
import {
  getAllTableContents,
  JsonTableItem,
  TableData,
  TableRow,
} from "../data/TableContent";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const jsonTableData = getAllTableContents();

function mockApiResponse<T>(
  endpoint: string,
  method: string,
  body?: unknown
): ApiResponse<T> {
  // GET /tables - Return all tables
  if (endpoint === "/tables" && method === "GET") {
    return { success: true, data: jsonTableData as unknown as T };
  }

  // POST /tables - Add new table
  if (endpoint === "/tables" && method === "POST") {
    const newTable: JsonTableItem = {
      id: Math.max(...jsonTableData.map((t) => t.id)) + 1,
      ...(body as Omit<JsonTableItem, "id">),
    };
    jsonTableData.push(newTable);
    return { success: true, data: newTable as unknown as T };
  }

  // DELETE /tables/:id - Delete table
  if (endpoint.match(/\/tables\/\d+$/) && method === "DELETE") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const index = jsonTableData.findIndex((t) => t.id === tableId);
    if (index !== -1) {
      jsonTableData.splice(index, 1);
      return { success: true, data: { success: true } as unknown as T };
    }
    return { success: false, error: "Table not found" };
  }

  // GET /tables/:id - Get single table
  if (endpoint.match(/\/tables\/\d+$/) && method === "GET") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const table = jsonTableData.find((t) => t.id === tableId);
    return table
      ? { success: true, data: table as unknown as T }
      : { success: false, error: "Table not found" };
  }

  // POST /tables/:id/rows - Add row to table
  if (endpoint.match(/\/tables\/\d+\/rows$/) && method === "POST") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const table = jsonTableData.find((t) => t.id === tableId);
    if (!table) return { success: false, error: "Table not found" };

    const newRow: TableRow = {
      id:
        Math.max(
          0,
          ...table.data.rows.map((r) => (typeof r.id === "number" ? r.id : 0))
        ) + 1,
      ...(body as Omit<TableRow, "id">),
    };
    table.data.rows.push(newRow);
    return { success: true, data: newRow as unknown as T };
  }

  // PATCH /tables/:id/rows/:rowId - Edit row
  if (endpoint.match(/\/tables\/\d+\/rows\/\d+$/) && method === "PATCH") {
    const parts = endpoint.split("/");
    const tableId = parseInt(parts[2]);
    const rowId = parseInt(parts[4]);
    const table = jsonTableData.find((t) => t.id === tableId);
    if (!table) return { success: false, error: "Table not found" };

    const row = table.data.rows.find((r) => r.id === rowId);
    if (!row) return { success: false, error: "Row not found" };

    // Update only the fields provided in `body`
    Object.entries(body as Partial<TableRow>).forEach(([key, value]) => {
      if (value !== undefined) {
        row[key] = value;
      }
    });

    return { success: true, data: row as unknown as T };
  }

  // DELETE /tables/:id/rows/:rowId - Delete row
  if (endpoint.match(/\/tables\/\d+\/rows\/\d+$/) && method === "DELETE") {
    const parts = endpoint.split("/");
    const tableId = parseInt(parts[2]);
    const rowId = parseInt(parts[4]);
    const table = jsonTableData.find((t) => t.id === tableId);
    if (!table) return { success: false, error: "Table not found" };

    table.data.rows = table.data.rows.filter((row) => row.id !== rowId);
    return { success: true, data: { success: true } as unknown as T };
  }

  // PUT /tables/:id/headers - Update headers
  if (endpoint.match(/\/tables\/\d+\/headers$/) && method === "PUT") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const table = jsonTableData.find((t) => t.id === tableId);
    if (!table) return { success: false, error: "Table not found" };

    const { headers } = body as { headers: string[] };
    table.data.headers = headers;
    return { success: true, data: table.data as unknown as T };
  }

  // POST /tables/:id/columns - Add column (header + update rows)
  if (endpoint.match(/\/tables\/\d+\/columns$/) && method === "POST") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const table = jsonTableData.find((t) => t.id === tableId);
    if (!table) return { success: false, error: "Table not found" };

    const { header } = body as { header: string };
    table.data.headers.push(header);
    table.data.rows.forEach((row) => {
      row[header] = "";
    });
    return { success: true, data: table.data as unknown as T };
  }

  return {
    success: false,
    error: `Mock not implemented for ${method} ${endpoint}`,
  };
}

// Helper function for API requests
const apiRequest = async <T>(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  const USE_MOCK_RESPONSES = true;

  if (USE_MOCK_RESPONSES) {
    // Use your static data for mock responses
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

export const jsonTableApi = {
  // Get all tables
  async getTables(): Promise<ApiResponse<JsonTableItem[]>> {
    return apiRequest<JsonTableItem[]>("/tables", "GET");
  },

  // Add a new table
  async addTable(
    tableData: Omit<JsonTableItem, "id">
  ): Promise<ApiResponse<JsonTableItem>> {
    return apiRequest<JsonTableItem>("/tables", "POST", tableData);
  },

  // Delete a table
  async deleteTable(
    tableId: number
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(`/tables/${tableId}`, "DELETE");
  },

  // Add a row to a table
  async addRow(
    tableId: number,
    row: Omit<TableRow, "id">
  ): Promise<ApiResponse<TableRow>> {
    return apiRequest<TableRow>(`/tables/${tableId}/rows`, "POST", row);
  },

  // Edit a row in a table
  async editRow(
    tableId: number,
    rowId: number | string,
    updates: Partial<TableRow>
  ): Promise<ApiResponse<TableRow>> {
    return apiRequest<TableRow>(
      `/tables/${tableId}/rows/${rowId}`,
      "PATCH",
      updates
    );
  },

  // Delete a row from a table
  async deleteRow(
    tableId: number,
    rowId: number | string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiRequest<{ success: boolean }>(
      `/tables/${tableId}/rows/${rowId}`,
      "DELETE"
    );
  },

  // Update table headers
  async updateHeaders(
    tableId: number,
    headers: string[]
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/tables/${tableId}/headers`, "PUT", {
      headers,
    });
  },

  // Add a column to a table
  async addColumn(
    tableId: number,
    header: string
  ): Promise<ApiResponse<TableData>> {
    return apiRequest<TableData>(`/tables/${tableId}/columns`, "POST", {
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
        const response = await jsonTableApi.addTable({ data });

        if (response.error) throw new Error(response.error);

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

        if (response.error) throw new Error(response.error);

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

        if (response.error) throw new Error(response.error);

        dispatch({
          type: "EDIT_ROW",
          payload: {
            tableId,
            rowId,
            newRow: response.data || newRow,
          },
        });
        break;
      }

      case "DELETE_ROW": {
        const { tableId, rowId } = action.payload;
        const response = await jsonTableApi.deleteRow(tableId, rowId);

        if (response.error) throw new Error(response.error);

        dispatch(action);
        break;
      }

      case "EDIT_TABLE_HEADERS": {
        const { tableId, headers } = action.payload;
        const response = await jsonTableApi.updateHeaders(tableId, headers);

        if (response.error) throw new Error(response.error);

        dispatch(action);
        break;
      }

      case "DELETE_TABLE": {
        const { tableId } = action.payload;
        const response = await jsonTableApi.deleteTable(tableId);

        if (response.error) throw new Error(response.error);

        dispatch(action);
        break;
      }

      case "ADD_COLUMN": {
        const { tableId, header } = action.payload;
        const response = await jsonTableApi.addColumn(tableId, header);

        if (response.error) throw new Error(response.error);

        dispatch({
          type: "ADD_COLUMN",
          payload: {
            tableId,
            header,
            // Include any additional data from the response if needed
          },
        });
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
