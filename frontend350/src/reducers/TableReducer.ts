import { TableDataType } from "@/data/table";
export type TableDataAction =
  | { type: "EDIT"; payload: { id: number; table_name: string } }
  | { type: "SHARE"; payload: { id: number } } // Even if not used yet, add payload for future consistency
  | { type: "DELETE"; payload: { id: number } }
  | { type: "SET_TABLES"; payload: TableDataType[] }
  | {
      type: "ADD_TABLE";
      payload: { id: number; table_name: string; description: string };
    };

export const TableReducer = (
  tables: TableDataType[],
  action: TableDataAction
): TableDataType[] => {
  switch (action.type) {
    case "SET_TABLES": {
      return [...action.payload];
    }
    case "ADD_TABLE": {
      return [
        ...tables,
        {
          id: action.payload.id,
          table_name: action.payload.table_name,
          user_id: "1",
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
          description: action.payload.description,
          pendingCount: 0,
        },
      ].sort(
        (a, b) =>
          new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime()
      );
    }
    case "EDIT": {
      return tables
        .map((table) =>
          table.id === action.payload.id
            ? {
                ...table,
                table_name: action.payload.table_name,
                modified_at: new Date().toISOString(),
              }
            : table
        )
        .sort(
          (a, b) =>
            new Date(b.modified_at).getTime() -
            new Date(a.modified_at).getTime()
        );
    }

    case "SHARE": {
      console.log("Share logic will implement later.");
      return [...tables]; // Return unchanged state
    }

    case "DELETE": {
      return tables.filter((table) => table.id !== action.payload.id);
    }

    default:
      return [...tables]; // Fallback for unrecognized action
  }
};
