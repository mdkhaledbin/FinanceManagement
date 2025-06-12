import { handleJsonTableOperation } from "@/api/TableContentApi";
import { useTablesContent } from "@/context/DataProviderReal";
import { useTheme } from "@/context/ThemeProvider";
import { useTablesData } from "@/context/DataProviderReal";
import { useSelectedTable } from "@/context/SelectedTableProvider";
import React, { useState } from "react";
import ReactDOM from "react-dom";

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

interface CreateTableModalProps {
  onCloseModal: () => void;
}

const CreateTableModal: React.FC<CreateTableModalProps> = ({
  onCloseModal,
}) => {
  const { theme } = useTheme();
  const [tableName, setTableName] = useState("");
  const [description, setDescription] = useState("");
  const [headers, setHeaders] = useState("");
  const [error, setError] = useState("");
  const { dispatchtablesContent } = useTablesContent();
  const { dispatchTablesData } = useTablesData();
  const { setSelectedTable } = useSelectedTable();

  const handleCreateTable = async () => {
    if (!tableName.trim()) {
      setError("Table name is required");
      return;
    }

    try {
      const headersArray = headers
        .split(",")
        .map((h) => h.trim())
        .filter((h) => h);
      const defaultHeaders = ["id", ...headersArray];

      const response = await handleJsonTableOperation(
        {
          type: "ADD_TABLE",
          payload: {
            table_name: tableName,
            headers: defaultHeaders,
            description: description || "",
          },
        },
        dispatchtablesContent
      );

      // Also dispatch to the sidebar reducer
      if (response?.success && response?.data) {
        const responseData = response.data as unknown as CreateTableResponse;
        const tableData = responseData.data;
        console.log("CreateTableModal - Response Data:", response.data);
        console.log("CreateTableModal - Table Data:", tableData);

        dispatchTablesData({
          type: "ADD_TABLE",
          payload: {
            id: tableData.id,
            table_name: tableName,
            description: description || "",
            headers: defaultHeaders,
          },
        });

        // Select the newly created table
        console.log("CreateTableModal - Setting Selected Table:", tableData.id);
        setSelectedTable(tableData.id);
      }

      onCloseModal();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create table"
      );
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCloseModal();
    }
  };

  const modalContent = (
    <div
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <div
        className={`w-full max-w-lg rounded-2xl p-6 shadow-lg transform transition-all duration-300 ${
          theme === "dark"
            ? "bg-gray-800 text-gray-100"
            : "bg-white text-gray-900"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Table</h2>
          <button
            onClick={onCloseModal}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 rounded bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="tableName" className="block font-medium">
              Table Name:
            </label>
            <input
              id="tableName"
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block font-medium">
              Description (optional):
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="headers" className="block font-medium">
              Headers (comma separated):
            </label>
            <input
              id="headers"
              type="text"
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder="e.g., title, content, author"
              className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <small className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: &apos;id&apos; column will be added automatically
            </small>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onCloseModal}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTable}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Create Table
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CreateTableModal;
