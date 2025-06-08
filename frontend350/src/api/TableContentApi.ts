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

// Create a mutable copy of the static data
let jsonTableData = [...getAllTableContents()];

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
    if (
      typeof body === "object" &&
      body !== null &&
      "id" in body &&
      "data" in body
    ) {
      const newTable: JsonTableItem = {
        id: Number((body as { id: string | number }).id),
        data: (body as { data: TableData }).data,
      };
      jsonTableData.push(newTable);
      return { success: true, data: newTable as unknown as T };
    }
    return { success: false, error: "Invalid request body" };
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
    const tableIndex = jsonTableData.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) return { success: false, error: "Table not found" };

    const table = jsonTableData[tableIndex];
    const rowData = body as Omit<TableRow, "id">;

    // Generate new row ID
    const rowIds = table.data.rows
      .map((r) => (typeof r.id === "number" ? r.id : 0))
      .filter(Number.isInteger);
    const newRowId = rowIds.length > 0 ? Math.max(...rowIds) + 1 : 1;

    const newRow: TableRow = {
      id: newRowId,
      ...rowData,
      // Initialize all columns with empty values if they don't exist
      ...Object.fromEntries(
        table.data.headers
          .filter((header) => !(header in rowData))
          .map((header) => [header, ""])
      ),
    };

    // Create a new copy of the table with the updated rows
    const updatedTable = {
      ...table,
      data: {
        ...table.data,
        rows: [...table.data.rows, newRow],
      },
    };

    // Update the table in the array
    jsonTableData = [
      ...jsonTableData.slice(0, tableIndex),
      updatedTable,
      ...jsonTableData.slice(tableIndex + 1),
    ];

    return { success: true, data: newRow as unknown as T };
  }

  // PATCH /tables/:id/rows/:rowId - Edit row
  if (endpoint.match(/\/tables\/\d+\/rows\/\d+$/) && method === "PATCH") {
    const parts = endpoint.split("/");
    const tableId = parseInt(parts[2]);
    const rowId = parseInt(parts[4]);
    const tableIndex = jsonTableData.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) return { success: false, error: "Table not found" };

    const table = jsonTableData[tableIndex];
    const rowIndex = table.data.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return { success: false, error: "Row not found" };

    // Create a new copy of the row with updates
    const updatedRow = {
      ...table.data.rows[rowIndex],
      ...(body as Partial<TableRow>),
    };

    // Create a new copy of the table with the updated row
    const updatedTable = {
      ...table,
      data: {
        ...table.data,
        rows: [
          ...table.data.rows.slice(0, rowIndex),
          updatedRow,
          ...table.data.rows.slice(rowIndex + 1),
        ],
      },
    };

    // Update the table in the array
    jsonTableData = [
      ...jsonTableData.slice(0, tableIndex),
      updatedTable,
      ...jsonTableData.slice(tableIndex + 1),
    ];

    return { success: true, data: updatedRow as unknown as T };
  }

  // DELETE /tables/:id/rows/:rowId - Delete row
  if (endpoint.match(/\/tables\/\d+\/rows\/\d+$/) && method === "DELETE") {
    const parts = endpoint.split("/");
    const tableId = parseInt(parts[2]);
    const rowId = parseInt(parts[4]);
    const tableIndex = jsonTableData.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) return { success: false, error: "Table not found" };

    const table = jsonTableData[tableIndex];
    const initialLength = table.data.rows.length;

    // Create a new copy of the table with the row removed
    const updatedTable = {
      ...table,
      data: {
        ...table.data,
        rows: table.data.rows.filter((row) => row.id !== rowId),
      },
    };

    // Update the table in the array
    jsonTableData = [
      ...jsonTableData.slice(0, tableIndex),
      updatedTable,
      ...jsonTableData.slice(tableIndex + 1),
    ];

    return {
      success: initialLength !== updatedTable.data.rows.length,
      data: {
        success: initialLength !== updatedTable.data.rows.length,
      } as unknown as T,
    };
  }

  // PUT /tables/:id/headers - Update headers
  if (endpoint.match(/\/tables\/\d+\/headers$/) && method === "PUT") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const tableIndex = jsonTableData.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) return { success: false, error: "Table not found" };

    const table = jsonTableData[tableIndex];
    const { headers } = body as { headers: string[] };

    // Update rows to maintain column consistency
    const updatedRows = table.data.rows.map((row) => {
      const newRow: TableRow = { id: row.id };
      headers.forEach((header) => {
        // Ensure no undefined values are assigned and cast to correct type
        const value = Object.prototype.hasOwnProperty.call(row, header)
          ? row[header]
          : "";
        newRow[header] =
          value !== undefined
            ? (value as string | number | boolean | null)
            : "";
      });
      return newRow;
    });

    // Create a new copy of the table with updated headers and rows
    const updatedTable = {
      ...table,
      data: {
        headers,
        rows: updatedRows,
      },
    };

    // Update the table in the array
    jsonTableData = [
      ...jsonTableData.slice(0, tableIndex),
      updatedTable,
      ...jsonTableData.slice(tableIndex + 1),
    ];

    return { success: true, data: updatedTable.data as unknown as T };
  }

  // POST /tables/:id/columns - Add column (header + update rows)
  if (endpoint.match(/\/tables\/\d+\/columns$/) && method === "POST") {
    const tableId = parseInt(endpoint.split("/")[2]);
    const tableIndex = jsonTableData.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) return { success: false, error: "Table not found" };

    const table = jsonTableData[tableIndex];
    const { header } = body as { header: string };

    if (table.data.headers.includes(header)) {
      return { success: false, error: "Column already exists" };
    }

    // Create new headers array
    const newHeaders = [...table.data.headers, header];

    // Update rows with the new column
    const updatedRows = table.data.rows.map((row) => ({
      ...row,
      [header]: "",
    }));

    // Create a new copy of the table with updated headers and rows
    const updatedTable = {
      ...table,
      data: {
        headers: newHeaders,
        rows: updatedRows,
      },
    };

    // Update the table in the array
    jsonTableData = [
      ...jsonTableData.slice(0, tableIndex),
      updatedTable,
      ...jsonTableData.slice(tableIndex + 1),
    ];

    return { success: true, data: updatedTable.data as unknown as T };
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
  const USE_MOCK_RESPONSES = false;

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

export const jsonTableApi = {
  // Get all tables
  async getTables(): Promise<ApiResponse<JsonTableItem[]>> {
    return apiRequest<JsonTableItem[]>("/tables", "GET");
  },

  // Add a new table
  async addTable(
    id: string,
    tableData: Omit<JsonTableItem, "id">
  ): Promise<ApiResponse<JsonTableItem>> {
    return apiRequest<JsonTableItem>("/tables", "POST", { id, ...tableData });
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
        const response = await jsonTableApi.addTable(String(id), { data });

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

      default:
        break;
    }
  } catch (error) {
    console.error("Table operation failed:", error);
    // Consider dispatching an error action here
  }
};
