"use client";
import { createContext, useContext, useState } from "react";

export interface SelectedTableType {
  selectedTable: number | null;
  setSelectedTable: (table: number | null) => void;
}

const initialSelectedTable: SelectedTableType = {
  selectedTable: null,
  setSelectedTable: () => {},
};

export const SelectedTableContext =
  createContext<SelectedTableType>(initialSelectedTable);

import { ReactNode } from "react";

export const SelectedTableProvider = ({ children,}: { children: ReactNode;}) => {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  return (
    <SelectedTableContext.Provider value={{ selectedTable, setSelectedTable }}>
      {children}
    </SelectedTableContext.Provider>
  );
};

export const useSelectedTable = () => {
  return useContext(SelectedTableContext);
};
