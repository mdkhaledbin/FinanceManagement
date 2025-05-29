import { useSelectedTable } from "@/context/SelectedTableProvider";
import { getTableContents } from "@/data/TableContent";
import React from "react";

const ShowTable = () => {
  const { selectedTable } = useSelectedTable();
  const TableContent = getTableContents(selectedTable);

  if (TableContent.length === 0) {
    return (
      <p className="text-gray-500">No table selected or table has no data.</p>
    );
  }

  const { headers, rows } = TableContent[0].data;

  return (
    <div className="overflow-auto max-h-[400px] mt-4 border border-gray-300 rounded-md">
      <table className="min-w-full border-collapse table-fixed text-sm font-sans">
        <thead className="bg-gray-100 sticky top-0 z-10">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2 border border-gray-300 text-left select-none"
                style={{ minWidth: "120px" }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-blue-100 transition-colors duration-150"
            >
              {headers.map((header) => (
                <td
                  key={header}
                  className="border border-gray-300 px-4 py-2 truncate"
                  title={String(row[header])} // show full content on hover
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


export default ShowTable;
