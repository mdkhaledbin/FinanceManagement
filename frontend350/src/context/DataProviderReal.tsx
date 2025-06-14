import { jsonTableApi } from "@/api/TableContentApi";
import { tableApi } from "@/api/TableDataApi";
import { TableDataType } from "@/data/table";
import { JsonTableItem } from "@/data/TableContent";
import {
  JsonTableAction,
  jsonTableReducer,
} from "@/reducers/TableContentReducer";
import { TableReducer, TableDataAction } from "@/reducers/TableReducer";
import {
  ReactNode,
  useReducer,
  createContext,
  useContext,
  useEffect,
} from "react";

interface TablesDataContextType {
  tablesData: TableDataType[];
  dispatchTablesData: React.Dispatch<TableDataAction>;
  getTableData: (tableId: number | null) => TableDataType[];
}

const initialTablesData: TableDataType[] = [];

export const TablesDataContext = createContext<TablesDataContextType | null>(
  null
);

interface TablesContentContextType {
  tablesContent: JsonTableItem[];
  dispatchtablesContent: React.Dispatch<JsonTableAction>;
  getTableContents: (tableId: number | null) => JsonTableItem[];
  refreshData: () => Promise<void>;
}

const initialTablesContent: JsonTableItem[] = [];

export const TablesContentContext =
  createContext<TablesContentContextType | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [tablesData, dispatchTablesData] = useReducer(
    TableReducer,
    initialTablesData
  );
  const [tablesContent, dispatchtablesContent] = useReducer(
    jsonTableReducer,
    initialTablesContent
  );

  const refreshData = async () => {
    // Fetch table contents
    const contentResponse = await jsonTableApi.getTables();
    if (contentResponse.success && contentResponse.data) {
      dispatchtablesContent({
        type: "SET_TABLES",
        payload: contentResponse.data,
      });
    }

    // Fetch table data
    const dataResponse = await tableApi.getTables();
    if (dataResponse.success && dataResponse.data) {
      dispatchTablesData({ type: "SET_TABLES", payload: dataResponse.data });
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getTableContents = (tableId: number | null) => {
    if (tableId === null) return [];
    return tablesContent.filter((table) => table.id === tableId);
  };

  const getTableData = (tableId: number | null) => {
    if (tableId === null) return [];
    return tablesData.filter((table) => table.id === tableId);
  };

  return (
    <TablesDataContext.Provider
      value={{ tablesData, getTableData, dispatchTablesData }}
    >
      <TablesContentContext.Provider
        value={{
          tablesContent,
          dispatchtablesContent,
          getTableContents,
          refreshData,
        }}
      >
        {children}
      </TablesContentContext.Provider>
    </TablesDataContext.Provider>
  );
};

export const useTablesData = () => {
  const context = useContext(TablesDataContext);
  if (!context) {
    throw new Error("useTablesData must be used within a DataProvider");
  }
  return context;
};

export const useTablesContent = () => {
  const context = useContext(TablesContentContext);
  if (!context) {
    throw new Error("useTablesContent must be used within a DataProvider");
  }
  return context;
};
