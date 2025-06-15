//showTable.tsx
import { useState, useRef, useEffect } from "react";
import { useTablesContent, useTablesData } from "@/context/DataProviderReal";
import { useSelectedTable } from "@/context/SelectedTableProvider";
import { TableRow, JsonTableItem } from "@/data/TableContent";
import { useTheme } from "@/context/ThemeProvider";
import { handleJsonTableOperation } from "@/api/TableContentApi";
import { jsonTableApi } from "@/api/TableContentApi";
import EmptyTableState from "./EmptyTableState";

// Simple icon components for demonstration
type IconProps = {
  className?: string;
};

const PlusIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const ColumnIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

const TrashIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const EditIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DuplicateIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const ShowTable = () => {
  const { selectedTable } = useSelectedTable();
  console.log(`Selected Table for showing is: ${selectedTable}`);
  const { getTableContents, dispatchtablesContent } = useTablesContent();
  const { theme } = useTheme();
  const { getTableData } = useTablesData();

  const selectedTableData = getTableData(selectedTable);
  const TableContent = getTableContents(selectedTable);

  // Editing state
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    header: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const tableRef = useRef<HTMLTableElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    rowIndex?: number;
    header?: string;
  }>({ visible: false, x: 0, y: 0 });

  const [editingHeader, setEditingHeader] = useState<{
    header: string;
    value: string;
  } | null>(null);

  const [isOperationInProgress, setIsOperationInProgress] = useState(false);
  const [lastOperationError, setLastOperationError] = useState<string | null>(
    null
  );

  // Cell editing handlers
  const handleCellClick = (rowIndex: number, header: string) => {
    // Check if header matches any of the serial number patterns
    if (
      header.toLowerCase().match(/^(id|id number|number|no\.?|serial|sr\.?)$/i)
    ) {
      return; // Prevent editing if header matches serial number patterns
    }

    const cellValue = rows[rowIndex][header];
    setEditingCell({ rowIndex, header });
    setEditValue(
      cellValue !== null && cellValue !== undefined ? String(cellValue) : ""
    );
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = async () => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;
    const rowId = rows[rowIndex].id;
    if (typeof rowId !== "string" && typeof rowId !== "number") {
      setEditingCell(null);
      return;
    }

    await handleJsonTableOperation(
      {
        type: "EDIT_ROW",
        payload: {
          tableId: TableContent[0].id,
          rowId: rowId,
          newRow: { [header]: editValue },
        },
      },
      dispatchtablesContent
    );
    // dispatchtablesContent({
    //   type: "EDIT_ROW",
    //   payload: {
    //     tableId: TableContent[0].id,
    //     rowId: rowId,
    //     newRow: { [header]: editValue },
    //   },
    // });
    setEditingCell(null);
  };

  // Keyboard navigation
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;

    switch (e.key) {
      case "Enter":
        await handleCellBlur();
        if (rowIndex < rows.length - 1) {
          const downCellValue = rows[rowIndex + 1][header];
          setEditValue(
            downCellValue !== null && downCellValue !== undefined
              ? String(downCellValue)
              : ""
          ); // Reset editValue for the new cell
          setEditingCell({ rowIndex: rowIndex + 1, header });
        }
        break;

      case "Tab":
        e.preventDefault();
        await handleCellBlur();
        const currentHeaderIndex = headers.indexOf(header);
        if (currentHeaderIndex < headers.length - 1) {
          const nextHeader = headers[currentHeaderIndex + 1];
          const nextCellValue = rows[rowIndex][nextHeader];
          setEditValue(
            nextCellValue !== null && nextCellValue !== undefined
              ? String(nextCellValue)
              : ""
          );
          setEditingCell({ rowIndex, header: nextHeader });
        } else if (rowIndex < rows.length - 1) {
          const nextRowFirstHeader = headers[1];
          const nextCellValue = rows[rowIndex + 1][nextRowFirstHeader];
          setEditValue(
            nextCellValue !== null && nextCellValue !== undefined
              ? String(nextCellValue)
              : ""
          );
          setEditingCell({
            rowIndex: rowIndex + 1,
            header: nextRowFirstHeader,
          });
        }
        break;

      // Similar modifications for other cases...
      case "ArrowUp":
        e.preventDefault();
        await handleCellBlur();
        if (rowIndex > 0) {
          const upCellValue = rows[rowIndex - 1][header];
          setEditValue(
            upCellValue !== null && upCellValue !== undefined
              ? String(upCellValue)
              : ""
          );
          setEditingCell({ rowIndex: rowIndex - 1, header });
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        await handleCellBlur();
        if (rowIndex < rows.length - 1) {
          const downCellValue = rows[rowIndex + 1][header];
          setEditValue(
            downCellValue !== null && downCellValue !== undefined
              ? String(downCellValue)
              : ""
          );
          setEditingCell({ rowIndex: rowIndex + 1, header });
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        await handleCellBlur();
        const leftHeaderIndex = headers.indexOf(header);
        if (leftHeaderIndex > 1) {
          const leftHeader = headers[leftHeaderIndex - 1];
          const leftCellValue = rows[rowIndex][leftHeader];
          setEditValue(
            leftCellValue !== null && leftCellValue !== undefined
              ? String(leftCellValue)
              : ""
          );
          setEditingCell({ rowIndex, header: leftHeader });
        } else if (leftHeaderIndex === 1) {
          const leftHeader = headers[headers.length - 1];
          const leftCellValue = rows[rowIndex][leftHeader];
          setEditValue(
            leftCellValue !== null && leftCellValue !== undefined
              ? String(leftCellValue)
              : ""
          );
          setEditingCell({ rowIndex, header: leftHeader });
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        await handleCellBlur();
        const rightHeaderIndex = headers.indexOf(header);
        if (rightHeaderIndex < headers.length - 1) {
          const rightHeader = headers[rightHeaderIndex + 1];
          const rightCellValue = rows[rowIndex][rightHeader];
          setEditValue(
            rightCellValue !== null && rightCellValue !== undefined
              ? String(rightCellValue)
              : ""
          );
          setEditingCell({ rowIndex, header: rightHeader });
        } else if (rightHeaderIndex === headers.length - 1) {
          const rightHeader = headers[1];
          const rightCellValue = rows[rowIndex][rightHeader];
          setEditValue(
            rightCellValue !== null && rightCellValue !== undefined
              ? String(rightCellValue)
              : ""
          );
          setEditingCell({ rowIndex, header: rightHeader });
        }
        break;

      case "Escape":
        setEditingCell(null);
        break;
    }
  };

  // Add a function to refresh table data
  const refreshTableData = async () => {
    try {
      if (!selectedTable) {
        throw new Error("No table selected");
      }

      // Get the current table data
      const response = await jsonTableApi.getTables();

      if (!response?.success) {
        throw new Error(response?.error || "Failed to refresh table data");
      }

      // Update the state with the new data
      dispatchtablesContent({
        type: "SET_TABLES",
        payload: response.data as JsonTableItem[],
      });
    } catch (error) {
      console.error("Failed to refresh table data:", error);
    }
  };

  const handleDeleteColumn = async (header: string) => {
    if (isOperationInProgress) {
      console.log("Operation already in progress, please wait...");
      return;
    }

    try {
      setIsOperationInProgress(true);
      setLastOperationError(null);

      if (!TableContent || TableContent.length === 0) {
        throw new Error("No table content available");
      }

      const tableId = TableContent[0].id;
      if (!tableId) {
        throw new Error("Invalid table ID");
      }

      if (headers.length <= 1) {
        throw new Error("Cannot delete the last column");
      }

      if (header === "id") {
        throw new Error("Cannot delete the ID column");
      }

      console.log("Deleting column:", { tableId, header });

      const response = await handleJsonTableOperation(
        {
          type: "EDIT_TABLE_HEADERS",
          payload: {
            tableId,
            headers: [header], // Send the header to delete
          },
        },
        dispatchtablesContent
      );

      if (!response?.success) {
        throw new Error(response?.error || "Failed to delete column");
      }

      console.log("Column deleted successfully");

      // Refresh table data to ensure consistency
      await refreshTableData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error in handleDeleteColumn:", errorMessage);
      setLastOperationError(errorMessage);
      // Refresh table data to recover from error state
      await refreshTableData();
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleAddRow = async () => {
    if (isOperationInProgress) {
      console.log("Operation already in progress, please wait...");
      return;
    }

    try {
      setIsOperationInProgress(true);
      setLastOperationError(null);

      if (!TableContent || TableContent.length === 0) {
        throw new Error("No table content available");
      }

      // Create initial row with empty values
      const newRow: Omit<TableRow, "id"> = {};
      headers.forEach((header) => {
        if (header !== "id") {
          newRow[header] = "";
        }
      });

      const response = await handleJsonTableOperation(
        {
          type: "ADD_ROW",
          payload: {
            tableId: TableContent[0].id,
            row: newRow,
          },
        },
        dispatchtablesContent
      );

      if (!response?.success) {
        throw new Error(response?.error || "Failed to add row");
      }

      if (response?.data) {
        console.log("Add Row Response:", response.data);

        // Refresh table data to ensure consistency
        await refreshTableData();

        // Set editing cell after successful addition
        setTimeout(() => {
          const newRowIndex = rows.length;
          setEditingCell({
            rowIndex: newRowIndex,
            header: headers[1],
          });
          setEditValue("");
        }, 0);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to add row:", errorMessage);
      setLastOperationError(errorMessage);
      // Refresh table data to recover from error state
      await refreshTableData();
    } finally {
      setIsOperationInProgress(false);
    }
  };

  const handleDuplicateRow = async (rowId: number | string) => {
    if (rowId === null) return;

    const sourceRow = rows.find((r) => r.id === rowId);
    if (!sourceRow) {
      console.error("No row found with id:", rowId);
      return;
    }

    // Create new row with source data
    const newRow: Omit<TableRow, "id"> = {};
    headers.forEach((header) => {
      if (header !== "id") {
        newRow[header] = sourceRow[header];
      }
    });

    try {
      const response = await handleJsonTableOperation(
        {
          type: "ADD_ROW",
          payload: {
            tableId: TableContent[0].id,
            row: newRow,
          },
        },
        dispatchtablesContent
      );

      if (response?.success && response?.data) {
        console.log("Duplicate Row Response:", response.data);
      }
    } catch (error) {
      console.error("Failed to duplicate row:", error);
    }
  };

  const handleAddColumn = async () => {
    try {
      if (!TableContent || TableContent.length === 0) {
        console.error("No table content available");
        return;
      }

      const tableId = TableContent[0].id;
      if (!tableId) {
        console.error("Invalid table ID");
        return;
      }

      // Generate a unique column name
      const existingHeaders = TableContent[0].data.headers;
      let columnNumber = existingHeaders.length;
      let newHeader = `column_${columnNumber}`;

      // Ensure the header name is unique
      while (existingHeaders.includes(newHeader)) {
        columnNumber++;
        newHeader = `column_${columnNumber}`;
      }

      console.log("Adding new column:", { tableId, newHeader });

      const response = await handleJsonTableOperation(
        {
          type: "ADD_COLUMN",
          payload: {
            tableId,
            header: newHeader,
          },
        },
        dispatchtablesContent
      );

      if (!response?.success) {
        throw new Error(response?.error || "Failed to add column");
      }

      // If we reach here, the operation was successful
      console.log("Column added successfully");
    } catch (error) {
      console.error(
        "Error in handleAddColumn:",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      // Show error to user (you can implement a toast notification here)
    }
  };

  const handleDeleteRow = async (rowId: number | string) => {
    await handleJsonTableOperation(
      {
        type: "DELETE_ROW",
        payload: {
          tableId: TableContent[0].id,
          rowId,
        },
      },
      dispatchtablesContent
    );
    // dispatchtablesContent({
    //   type: "DELETE_ROW",
    //   payload: {
    //     tableId: TableContent[0].id,
    //     rowId,
    //   },
    // });
  };

  // Update the delete column button to show loading state
  const renderDeleteColumnButton = (header: string) => (
    <button
      onClick={() => handleDeleteColumn(header)}
      className={`transition-colors ${
        isOperationInProgress
          ? "opacity-50 cursor-not-allowed"
          : theme === "dark"
          ? "text-gray-500 hover:text-red-400"
          : "text-gray-400 hover:text-red-500"
      }`}
      title="Delete column"
      disabled={isOperationInProgress}
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  );

  const handleContextMenu = (
    e: React.MouseEvent,
    rowIndex?: number,
    header?: string
  ) => {
    e.preventDefault();

    // Get absolute position accounting for scroll
    const x = e.clientX + window.scrollX - 265;
    const y = e.clientY + window.scrollY - 37;

    setContextMenu({
      visible: true,
      x,
      y,
      rowIndex,
      header,
    });
  };

  useEffect(() => {
    const handleClickOutside = () =>
      setContextMenu({ visible: false, x: 0, y: 0 });
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleHeaderDoubleClick = (header: string) => {
    if (header === "id") return; // Don't allow editing the ID header
    setEditingHeader({ header, value: header });
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingHeader) {
      setEditingHeader({ ...editingHeader, value: e.target.value });
    }
  };

  const handleHeaderBlur = async () => {
    if (!editingHeader) return;

    const { header: oldHeader, value: newHeader } = editingHeader;
    if (oldHeader === newHeader) {
      setEditingHeader(null);
      return;
    }

    try {
      await handleJsonTableOperation(
        {
          type: "EDIT_HEADER",
          payload: {
            tableId: TableContent[0].id,
            oldHeader,
            newHeader,
          },
        },
        dispatchtablesContent
      );
    } catch (error) {
      console.error("Failed to edit header:", error);
    }

    setEditingHeader(null);
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleHeaderBlur();
    } else if (e.key === "Escape") {
      setEditingHeader(null);
    }
  };

  // Add error display component
  const ErrorDisplay = () => {
    if (!lastOperationError) return null;

    return (
      <div
        className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50
        ${
          theme === "dark"
            ? "bg-red-900/90 text-red-100"
            : "bg-red-100 text-red-900"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span>{lastOperationError}</span>
          <button
            onClick={() => setLastOperationError(null)}
            className="ml-2 hover:opacity-70"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  if (TableContent.length === 0) {
    return <EmptyTableState />;
  }

  const { headers, rows } = TableContent[0].data;

  return (
    <div
      className={`overflow-auto h-[90vh] mt-0 rounded-2xl shadow-2xl relative pb-[-5]
  ${
    theme === "dark"
      ? "bg-gradient-to-br from-gray-900 via-gray-800/95 to-gray-900/90 text-gray-100"
      : "bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50 text-gray-800 border border-gray-200"
  }`}
    >
      <ErrorDisplay />
      <div className="scrollbar-custom pt-2 pb-2">
        <div className="min-w-max">
          {/* Enhanced Toolbar with Glass Morphism */}
          <div
            className={`p-4 border-b flex justify-between items-center sticky top-0 z-20 backdrop-blur-lg
              ${
                theme === "dark"
                  ? "bg-gray-900/80 border-gray-700 shadow-lg"
                  : "bg-white/80 border-gray-200 shadow-sm"
              }`}
          >
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                {selectedTableData[0]?.table_name ?? ""}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium shadow-inner
        ${
          theme === "dark"
            ? "bg-blue-900/30 text-blue-300 border border-blue-800/50"
            : "bg-blue-100/80 text-blue-700 border border-blue-200"
        }`}
              >
                {rows.length} {rows.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleAddRow}
                className={`px-5 py-2.5 text-white rounded-xl flex items-center gap-2 transition-all duration-500 ease-in-out shadow-lg hover:scale-[1.02]
          ${
            theme === "dark"
              ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 hover:shadow-blue-500/30"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 hover:shadow-blue-400/40"
          }`}
              >
                <PlusIcon className="w-4 h-4" />
                <span className="font-medium">Add Row</span>
              </button>
              <button
                onClick={handleAddColumn}
                className={`px-5 py-2.5 text-white rounded-xl flex items-center gap-2 transition-all duration-500 ease-in-out shadow-lg hover:scale-[1.02]
          ${
            theme === "dark"
              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-500/30"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-400/40"
          }`}
              >
                <ColumnIcon className="w-4 h-4" />
                <span className="font-medium">Add Field</span>
              </button>
            </div>
          </div>

          {/* Luxurious Table with Enhanced Styling */}
          <table
            ref={tableRef}
            className="min-w-full border-collapse table-fixed text-sm font-sans overflow-x-auto mb-10"
            onKeyDown={handleKeyDown}
          >
            <thead className="sticky top-16 z-10">
              <tr
                className={`backdrop-blur-lg
        ${theme === "dark" ? "bg-gray-900/80" : "bg-white/90"} shadow-sm`}
              >
                {headers.map((header) => (
                  <th
                    key={header}
                    className={`px-6 py-4 border-b text-left font-medium select-none transition-colors duration-500 ease-in-out
              ${
                theme === "dark"
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800/50"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
                    style={{ minWidth: "180px" }}
                    onDoubleClick={() => handleHeaderDoubleClick(header)}
                    onContextMenu={(e) =>
                      header !== "id" && handleContextMenu(e, undefined, header)
                    }
                  >
                    <div className="flex items-center justify-between">
                      {editingHeader?.header === header ? (
                        <input
                          type="text"
                          value={editingHeader.value}
                          onChange={handleHeaderChange}
                          onBlur={handleHeaderBlur}
                          onKeyDown={handleHeaderKeyDown}
                          autoFocus
                          className={`w-full px-3 py-2 rounded-xl focus:ring-2 outline-none transition-all shadow-inner
                    ${
                      theme === "dark"
                        ? "bg-gray-800 border border-blue-500/70 text-white focus:ring-blue-400/50"
                        : "bg-white border border-blue-400 text-gray-800 focus:ring-blue-300/50"
                    }`}
                        />
                      ) : (
                        <div className="flex items-center">
                          <span
                            className={`uppercase tracking-wider text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r
                              ${
                                theme === "dark"
                                  ? "from-blue-400 to-emerald-400"
                                  : "from-blue-600 to-emerald-600"
                              }`}
                          >
                            {header}
                          </span>
                        </div>
                      )}
                      {headers.length > 1 &&
                        header !== "id" &&
                        renderDeleteColumnButton(header)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className={`divide-y
                ${
                  theme === "dark"
                    ? "divide-gray-800/50 hover:divide-gray-700/50"
                    : "divide-gray-100/80 hover:divide-gray-200/80"
                }`}
            >
              {rows.map((row, rowIndex) => (
                <tr
                  key={typeof row.id === "string" ? row.id : `row-${rowIndex}`}
                  className={`transition-all duration-500 ease-in-out group
            ${
              theme === "dark"
                ? "hover:bg-gray-800/30 hover:shadow-[0_0_15px_rgba(0,0,0,0.1)]"
                : "hover:bg-gray-50/70 hover:shadow-[0_0_15px_rgba(0,0,0,0.05)]"
            }`}
                  onContextMenu={(e) => handleContextMenu(e, rowIndex)}
                >
                  {headers.map((header) => (
                    <td
                      key={`${rowIndex}-${header}`}
                      className={`px-6 py-4 transition-colors duration-500 ease-in-out ${
                        header === "amount" ? "font-mono" : ""
                      }
                ${
                  theme === "dark"
                    ? "text-gray-300 group-hover:text-gray-100"
                    : "text-gray-700 group-hover:text-gray-900"
                }`}
                      onClick={() => handleCellClick(rowIndex, header)}
                    >
                      {editingCell?.rowIndex === rowIndex &&
                      editingCell?.header === header ? (
                        <input
                          type={header === "amount" ? "number" : "text"}
                          value={editValue}
                          onChange={handleCellChange}
                          onBlur={handleCellBlur}
                          autoFocus
                          className={`w-full px-4 py-2.5 rounded-xl transition-all duration-500 ease-in-out shadow-inner
                    ${
                      theme === "dark"
                        ? "bg-gray-800/70 text-white border border-gray-700 hover:border-blue-500/70 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        : "bg-white text-gray-800 border border-gray-200 hover:border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                    }
                    outline-none`}
                        />
                      ) : (
                        <div className="flex items-center">
                          {header === "amount" && (
                            <span
                              className={`mr-2 text-sm ${
                                parseFloat(String(row[header] ?? 0)) < 0
                                  ? theme === "dark"
                                    ? "text-red-400"
                                    : "text-red-500"
                                  : theme === "dark"
                                  ? "text-emerald-400"
                                  : "text-emerald-600"
                              }`}
                            >
                              {parseFloat(String(row[header] ?? 0)) < 0
                                ? "↓"
                                : "↑"}
                            </span>
                          )}
                          <span
                            className={`truncate ${
                              header === "amount"
                                ? parseFloat(String(row[header] ?? 0)) < 0
                                  ? theme === "dark"
                                    ? "text-red-300"
                                    : "text-red-600"
                                  : theme === "dark"
                                  ? "text-emerald-300"
                                  : "text-emerald-700"
                                : ""
                            }`}
                            title={String(row[header])}
                          >
                            {header
                              .toLowerCase()
                              .match(
                                /^(id|id number|number|no\.?|serial|sr\.?)$/i
                              )
                              ? rowIndex + 1
                              : header === "amount"
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(
                                  parseFloat(String(row[header] ?? 0)) || 0
                                )
                              : row[header]}
                          </span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Premium Status Bar */}
          <div
            className={`fixed bottom-0 left-0 right-0 backdrop-blur-lg px-5 py-3 text-xs border-t flex justify-between items-center z-50
              ${
                theme === "dark"
                  ? "bg-gray-900/80 border-gray-700 text-gray-400 shadow-lg"
                  : "bg-white/90 border-gray-200 text-gray-500 shadow-sm"
              } w-[100%]`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  theme === "dark" ? "bg-blue-500" : "bg-blue-400"
                }`}
              ></span>
              Last updated: {selectedTableData[0]?.modified_at ?? "Just now"}
            </div>
            <div className="flex items-center gap-6 justify-end">
              <span className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    theme === "dark" ? "bg-emerald-400" : "bg-emerald-500"
                  }`}
                ></span>
                <span className="font-medium">Income</span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    theme === "dark" ? "bg-red-400" : "bg-red-500"
                  }`}
                ></span>
                <span className="font-medium">Expense</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Context Menu */}
      {contextMenu.visible && (
        <div
          className={`fixed shadow-2xl rounded-xl py-1 z-50 overflow-hidden min-w-[200px] backdrop-blur-lg border
        ${
          theme === "dark"
            ? "bg-gray-800/90 border-gray-700"
            : "bg-white/95 border-gray-200"
        }`}
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            transform: "scale(0.95)",
            animation: "scaleIn 0.15s ease-out forwards",
            transformOrigin: "top left",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.rowIndex !== undefined && (
            <>
              <button
                className={`flex w-full items-center px-5 py-3 transition-all duration-500 ease-in-out gap-3 hover:pl-6
              ${
                theme === "dark"
                  ? "text-gray-300 hover:bg-gray-700/80"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
                onClick={() => {
                  const rowId = rows[contextMenu.rowIndex!].id;
                  if (typeof rowId === "string" || typeof rowId === "number") {
                    handleDeleteRow(rowId);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0 });
                }}
              >
                <TrashIcon
                  className={`w-5 h-5 ${
                    theme === "dark" ? "text-red-400" : "text-red-500"
                  }`}
                />
                <span className="font-medium">Delete Entry</span>
              </button>
              <button
                className={`flex w-full items-center px-5 py-3 transition-all duration-500 ease-in-out gap-3 hover:pl-6
              ${
                theme === "dark"
                  ? "text-gray-300 hover:bg-gray-700/80"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
                onClick={() => {
                  setEditingCell({
                    rowIndex: contextMenu.rowIndex!,
                    header: headers[1],
                  });
                  setContextMenu({ visible: false, x: 0, y: 0 });
                }}
              >
                <EditIcon
                  className={`w-5 h-5 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-500"
                  }`}
                />
                <span className="font-medium">Edit Entry</span>
              </button>
              <div
                className={`my-1 ${
                  theme === "dark"
                    ? "border-t border-gray-700"
                    : "border-t border-gray-200"
                }`}
              ></div>
              <button
                className={`flex w-full items-center px-5 py-3 transition-all duration-500 ease-in-out gap-3 hover:pl-6
              ${
                theme === "dark"
                  ? "text-gray-300 hover:bg-gray-700/80"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
                onClick={() => {
                  const rowId = rows[contextMenu.rowIndex!].id;
                  if (typeof rowId === "string" || typeof rowId === "number") {
                    handleDuplicateRow(rowId);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0 });
                }}
              >
                <DuplicateIcon
                  className={`w-5 h-5 ${
                    theme === "dark" ? "text-purple-400" : "text-purple-500"
                  }`}
                />
                <span className="font-medium">Duplicate</span>
              </button>
            </>
          )}
          {contextMenu.header && contextMenu.header !== "id" && (
            <button
              className={`flex w-full items-center px-5 py-3 transition-all duration-500 ease-in-out gap-3 hover:pl-6
              ${
                theme === "dark"
                  ? "text-gray-300 hover:bg-gray-700/80"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                handleDeleteColumn(contextMenu.header!);
                setContextMenu({ visible: false, x: 0, y: 0 });
              }}
            >
              <TrashIcon
                className={`w-5 h-5 ${
                  theme === "dark" ? "text-red-400" : "text-red-500"
                }`}
              />
              <span className="font-medium">Delete Column</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowTable;
