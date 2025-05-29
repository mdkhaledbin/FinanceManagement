import { TableDataType } from "@/data/table";
type Action =
  | { type: "EDIT"; payload: { id: number; table_name: string } }
  | { type: "SHARE"; payload: { id: number } } // Even if not used yet, add payload for future consistency
  | { type: "DELETE"; payload: { id: number } };

export const TableReducer = (
  tables: TableDataType[],
  action: Action
): TableDataType[] => {
  switch (action.type) {
    case "EDIT": {
      return tables.map((table) =>
        table.id === action.payload.id
          ? {
              ...table,
              table_name: action.payload.table_name,
              modified_at: Date.now().toString(),
            }
          : table
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
