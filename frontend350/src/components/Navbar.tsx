"use client";
import React from "react";
import Image from "next/image";
import { LuSunDim } from "react-icons/lu";
import { HiMoon } from "react-icons/hi2";
import { useTheme } from "@/context/ThemeProvider";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className="fixed top-0 left-0 w-full flex justify-between items-center leading-[7vh]
     bg-violet-400 px-[5%] text-3xl font-bold uppercase z-1"
    >
      <div className="w-[150px] md:w-[200px] lg:w-[250px]">
        <Image
          src="/image.png"
          alt="Logo"
          width={250}
          height={50}
          className="w-full h-auto"
        />
      </div>
      <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
        {theme === "dark" ? <LuSunDim /> : <HiMoon />}
      </button>
    </div>
  );
};

export default Navbar;
