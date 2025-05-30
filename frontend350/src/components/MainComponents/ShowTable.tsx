import { useState, useRef, useEffect } from "react";
import { useTablesContent } from "@/context/DataProvider";
import { useSelectedTable } from "@/context/SelectedTableProvider";
import { TableRow } from "@/data/TableContent";

const ShowTable = () => {
  const { selectedTable } = useSelectedTable();
  const { getTableContents, dispatchtablesContent } = useTablesContent();
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
    const cellValue = rows[rowIndex][header];
    setEditingCell({ rowIndex, header });
    setEditValue(
      cellValue !== null && cellValue !== undefined ? String(cellValue) : ""
    );
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = () => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;
    const rowId = rows[rowIndex].id;
    if (typeof rowId !== "string" && typeof rowId !== "number") {
      setEditingCell(null);
      return;
    }

    dispatchtablesContent({
      type: "EDIT_ROW",
      payload: {
        tableId: TableContent[0].id,
        rowId: rowId,
        newRow: { [header]: editValue },
      },
    });

    setEditingCell(null);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    const { rowIndex, header } = editingCell;

    switch (e.key) {
      case "Enter":
        handleCellBlur();
        if (rowIndex < rows.length - 1) {
          setEditingCell({ rowIndex: rowIndex + 1, header });
        }
        break;

      case "Tab":
        e.preventDefault();
        handleCellBlur();
        const currentHeaderIndex = headers.indexOf(header);
        if (currentHeaderIndex < headers.length - 1) {
          setEditingCell({ rowIndex, header: headers[currentHeaderIndex + 1] });
        } else if (rowIndex < rows.length - 1) {
          setEditingCell({ rowIndex: rowIndex + 1, header: headers[0] });
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        handleCellBlur();
        if (rowIndex > 0) {
          setEditingCell({ rowIndex: rowIndex - 1, header });
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        handleCellBlur();
        if (rowIndex < rows.length - 1) {
          setEditingCell({ rowIndex: rowIndex + 1, header });
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        handleCellBlur();
        const leftHeaderIndex = headers.indexOf(header);
        if (leftHeaderIndex > 0) {
          setEditingCell({ rowIndex, header: headers[leftHeaderIndex - 1] });
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        handleCellBlur();
        const rightHeaderIndex = headers.indexOf(header);
        if (rightHeaderIndex < headers.length - 1) {
          setEditingCell({ rowIndex, header: headers[rightHeaderIndex + 1] });
        }
        break;

      case "Escape":
        setEditingCell(null);
        break;
    }
  };

  // Row operations
  const handleAddRow = () => {
    const newRow: TableRow = {
      id: Math.max(...rows.map((r) => Number(r.id)), 0) + 1,
    };
    headers.forEach((header) => {
      newRow[header] = "";
    });

    dispatchtablesContent({
      type: "ADD_ROW",
      payload: {
        tableId: TableContent[0].id,
        row: newRow,
      },
    });

    setTimeout(() => {
      setEditingCell({
        rowIndex: rows.length,
        header: headers[0],
      });
      setEditValue("");
    }, 0);
  };

  const handleDeleteRow = (rowId: number | string) => {
    dispatchtablesContent({
      type: "DELETE_ROW",
      payload: {
        tableId: TableContent[0].id,
        rowId,
      },
    });
  };

  // Column operations
  const handleAddColumn = () => {
    const newHeader = `column_${headers.length + 1}`;
    const newHeaders = [...headers, newHeader];

    dispatchtablesContent({
      type: "EDIT_TABLE_HEADERS",
      payload: {
        tableId: TableContent[0].id,
        headers: newHeaders,
      },
    });

    rows.forEach((row) => {
      if (typeof row.id === "string" || typeof row.id === "number") {
        dispatchtablesContent({
          type: "EDIT_ROW",
          payload: {
            tableId: TableContent[0].id,
            rowId: row.id,
            newRow: { [newHeader]: "" },
          },
        });
      }
    });
  };

  const handleDeleteColumn = (header: string) => {
    if (headers.length <= 1) return; // Don't delete the last column

    const newHeaders = headers.filter((h) => h !== header);
    dispatchtablesContent({
      type: "EDIT_TABLE_HEADERS",
      payload: {
        tableId: TableContent[0].id,
        headers: newHeaders,
      },
    });
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
      <p className="text-gray-500">No table selected or table has no data.</p>
    );
  }
  
  const { headers, rows } = TableContent[0].data;

  return (
    <div className="overflow-auto max-h-[400px] mt-4 border border-gray-300 rounded-md relative">
      {/* Toolbar */}
      <div className="p-2 bg-gray-100 border-b flex gap-2">
        <button
          onClick={handleAddRow}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Row
        </button>
        <button
          onClick={handleAddColumn}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Column
        </button>
      </div>

      {/* Table */}
      <table
        ref={tableRef}
        className="min-w-full border-collapse table-fixed text-sm font-sans"
        onKeyDown={handleKeyDown}
      >
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2 border border-gray-300 text-left select-none"
                style={{ minWidth: "120px" }}
                onContextMenu={(e) => handleContextMenu(e, undefined, header)}
              >
                <div className="flex justify-between items-center">
                  <span>{header}</span>
                  {headers.length > 1 && (
                    <button
                      onClick={() => handleDeleteColumn(header)}
                      className="text-red-500 hover:text-red-700 ml-2"
                      title="Delete column"
                    >
                      ×
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={
                typeof row.id === "string" || typeof row.id === "number"
                  ? row.id
                  : rowIndex
              }
              className="hover:bg-blue-100 transition-colors duration-150"
              onContextMenu={(e) => handleContextMenu(e, rowIndex)}
            >
              {headers.map((header) => (
                <td
                  key={`${rowIndex}-${header}`}
                  className="border border-gray-300 px-4 py-2 truncate"
                  onClick={() => handleCellClick(rowIndex, header)}
                >
                  {editingCell?.rowIndex === rowIndex &&
                  editingCell?.header === header ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={handleCellChange}
                      onBlur={handleCellBlur}
                      autoFocus
                      className="w-full px-2 py-1 border border-blue-500 rounded"
                    />
                  ) : (
                    <span title={String(row[header])}>{row[header]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white shadow-lg rounded-md py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.rowIndex !== undefined && (
            <>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  const rowId = rows[contextMenu.rowIndex!].id;
                  if (typeof rowId === "string" || typeof rowId === "number") {
                    handleDeleteRow(rowId);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0 });
                }}
              >
                Delete Row
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setEditingCell({
                    rowIndex: contextMenu.rowIndex!,
                    header: headers[0],
                  });
                  setContextMenu({ visible: false, x: 0, y: 0 });
                }}
              >
                Edit Row
              </button>
            </>
          )}
          {contextMenu.header && (
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => {
                handleDeleteColumn(contextMenu.header!);
                setContextMenu({ visible: false, x: 0, y: 0 });
              }}
            >
              Delete Column
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowTable;
