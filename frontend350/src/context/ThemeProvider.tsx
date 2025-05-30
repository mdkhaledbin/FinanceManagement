"use client";
import { createContext, useContext, useState } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const initialTheme: ThemeType = {
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
};

export const ThemeContext = createContext<ThemeType>(initialTheme);

import { ReactNode } from "react";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
