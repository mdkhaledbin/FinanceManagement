"use client";
import { createContext, useContext, useState } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

const initialTheme: ThemeType = {
  theme: "light",
  setTheme: () => {},
};

export const ThemeContext = createContext<ThemeType>(initialTheme);

import { ReactNode } from "react";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
