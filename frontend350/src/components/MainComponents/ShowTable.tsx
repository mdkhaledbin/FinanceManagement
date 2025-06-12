//showTable.tsx
import { useState, useRef, useEffect } from "react";
import { useTablesContent, useTablesData } from "@/context/DataProviderReal";
import { useSelectedTable } from "@/context/SelectedTableProvider";
import { TableRow } from "@/data/TableContent";
import { useTheme } from "@/context/ThemeProvider";
import { handleJsonTableOperation } from "@/api/TableContentApi";

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

  // Cell editing handlers
  const handleCellClick = (rowIndex: number, header: string) => {
    if (header === "id") return; // Prevent editing if header is "id"

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

  const handleAddRow = async () => {
    // Create initial row with empty values
    const newRow: Omit<TableRow, "id"> = {};
    headers.forEach((header) => {
      if (header !== "id") {
        newRow[header] = "";
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
        console.log("Add Row Response:", response.data);

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
      console.error("Failed to add row:", error);
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
    const newHeader = `column_${headers.length + 1}`;

    await handleJsonTableOperation(
      {
        type: "ADD_COLUMN",
        payload: {
          tableId: TableContent[0].id,
          header: newHeader,
        },
      },
      dispatchtablesContent
    );

    // dispatchtablesContent({
    //   type: "ADD_COLUMN",
    //   payload: {
    //     tableId: TableContent[0].id,
    //     header: newHeader,
    //   },
    // });
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

  const handleDeleteColumn = async (header: string) => {
    if (headers.length <= 1) return; // Don't delete the last column

    const newHeaders = headers.filter((h) => h !== header);

    await handleJsonTableOperation(
      {
        type: "EDIT_TABLE_HEADERS",
        payload: {
          tableId: TableContent[0].id,
          headers: newHeaders,
        },
      },
      dispatchtablesContent
    );
  };

  // Context menu
  const handleContextMenu = (
    e: React.MouseEvent,
    rowIndex?: number,
    header?: string
  ) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
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

  if (TableContent.length === 0) {
    return (
      <p className="text-gray-500 pt-[5vh] lg:pt-[1vh]">
        No table selected or table has no data.
      </p>
    );
  }

  const { headers, rows } = TableContent[0].data;

  return (
    <div
      className={`overflow-auto max-h-[600px] mt-0 rounded-xl shadow-2xl relative
  ${
    theme === "dark"
      ? "bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100"
      : "bg-gradient-to-br from-gray-50 to-white text-gray-800 border border-gray-200"
  }`}
    >
      <div className="scrollbar-custom pt-2 pb-2">
        <div className="min-w-max">
          {/* Enhanced Toolbar */}
          <div
            className={`p-3 border-b flex justify-between items-center
              ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }`}
          >
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold">
                {selectedTableData[0]?.table_name ?? ""}
              </h2>
              <span
                className={`px-2 py-1 rounded-full text-xs
        ${
          theme === "dark"
            ? "bg-blue-900/50 text-blue-300"
            : "bg-blue-100 text-blue-700"
        }`}
              >
                {rows.length} entries
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddRow}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg
          ${
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20"
              : "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30"
          }`}
              >
                <PlusIcon className="w-4 h-4" />
                Add Transaction
              </button>
              <button
                onClick={handleAddColumn}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg
          ${
            theme === "dark"
              ? "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/20"
              : "bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/30"
          }`}
              >
                <ColumnIcon className="w-4 h-4" />
                Add Field
              </button>
            </div>
          </div>

          {/* Luxurious Table */}
          <table
            ref={tableRef}
            className="min-w-full border-collapse table-fixed text-sm font-sans overflow-x-auto"
            onKeyDown={handleKeyDown}
          >
            <thead className="sticky top-0 z-10">
              <tr
                className={`backdrop-blur-sm
        ${theme === "dark" ? "bg-gray-800/90" : "bg-white/90"}`}
              >
                {headers.map((header) => (
                  <th
                    key={header}
                    className={`px-6 py-4 border-b text-left font-medium select-none
              ${
                theme === "dark"
                  ? "border-gray-700 text-gray-300"
                  : "border-gray-200 text-gray-600"
              }`}
                    style={{ minWidth: "150px" }}
                    onContextMenu={(e) =>
                      header !== "id" && handleContextMenu(e, undefined, header)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`uppercase tracking-wider text-xs font-semibold
                ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {header}
                      </span>
                      {headers.length > 1 && header !== "id" && (
                        <button
                          onClick={() => handleDeleteColumn(header)}
                          className={`transition-colors
                    ${
                      theme === "dark"
                        ? "text-gray-500 hover:text-red-400"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                          title="Delete column"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className={`divide-y
      ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}
            >
              {rows.map((row, rowIndex) => (
                <tr
                  key={typeof row.id === "string" ? row.id : `row-${rowIndex}`}
                  className={`transition-colors duration-150 group
            ${theme === "dark" ? "hover:bg-gray-800/50" : "hover:bg-gray-50"}`}
                  onContextMenu={(e) => handleContextMenu(e, rowIndex)}
                >
                  {headers.map((header) => (
                    <td
                      key={`${rowIndex}-${header}`}
                      className={`px-6 py-4 ${
                        header === "amount" ? "font-mono" : ""
                      }
                ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
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
                          className={`w-full px-3 py-2 rounded-lg focus:ring-2 outline-none transition-all
                    ${
                      theme === "dark"
                        ? "bg-gray-700 border border-blue-500 text-white focus:ring-blue-400"
                        : "bg-white border border-blue-400 text-gray-800 focus:ring-blue-300"
                    }`}
                        />
                      ) : (
                        <div className="flex items-center">
                          {header === "amount" && (
                            <span
                              className={`mr-2 text-xs ${
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
                            {header === "amount"
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
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

          {/* Status Bar */}
          <div
            className={`sticky bottom-0 backdrop-blur-sm px-4 py-2 text-xs border-t flex justify-between items-center
              ${
                theme === "dark"
                  ? "bg-gray-800/90 border-gray-700 text-gray-400"
                  : "bg-white/90 border-gray-200 text-gray-500"
              }`}
          >
            <div>Last updated: {selectedTableData[0]?.modified_at ?? ""}</div>
            <div className="flex items-center gap-4 justify-end">
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    theme === "dark" ? "bg-emerald-400" : "bg-emerald-500"
                  }`}
                ></span>
                Income
              </span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    theme === "dark" ? "bg-red-400" : "bg-red-500"
                  }`}
                ></span>
                Expense
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Context Menu */}
      {contextMenu.visible && (
        <div
          className={`fixed shadow-xl rounded-lg py-1 z-50 overflow-hidden min-w-[180px]
        ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200 shadow-lg"
        }`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.rowIndex !== undefined && (
            <>
              <button
                className={`flex w-full items-center px-4 py-3 transition-colors gap-2
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
                  className={`w-4 h-4 ${
                    theme === "dark" ? "text-red-400" : "text-red-500"
                  }`}
                />
                <span>Delete Entry</span>
              </button>
              <button
                className={`flex w-full items-center px-4 py-3 transition-colors gap-2
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
                  className={`w-4 h-4 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-500"
                  }`}
                />
                <span>Edit Entry</span>
              </button>
              <div
                className={`my-1 ${
                  theme === "dark"
                    ? "border-t border-gray-700"
                    : "border-t border-gray-200"
                }`}
              ></div>
              <button
                className={`flex w-full items-center px-4 py-3 transition-colors gap-2
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
                  className={`w-4 h-4 ${
                    theme === "dark" ? "text-purple-400" : "text-purple-500"
                  }`}
                />
                <span>Duplicate</span>
              </button>
            </>
          )}
          {contextMenu.header && contextMenu.header !== "id" && (
            <button
              className={`flex w-full items-center px-4 py-3 transition-colors gap-2
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
                className={`w-4 h-4 ${
                  theme === "dark" ? "text-red-400" : "text-red-500"
                }`}
              />
              <span>Delete Column</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowTable;
