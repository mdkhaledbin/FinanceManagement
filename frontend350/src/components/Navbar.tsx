import React from "react";
import Image from "next/image";
import { LuSunDim } from "react-icons/lu";
import { HiMoon } from "react-icons/hi2";

const Navbar = () => {
  const theme = "";
  return (
    <div className="fixed top-0 left-0 w-full flex justify-between items-center leading-[7vh] bg-violet-400 px-[5%] text-3xl font-bold uppercase">
      <div className="w-[150px] md:w-[200px] lg:w-[250px]">
        <Image
          src="/image.png"
          alt="Logo"
          width={250}
          height={50}
          className="w-full h-auto"
        />
      </div>
      {theme === "dark" ? <LuSunDim /> : <HiMoon />}
    </div>
  );
};

export default Navbar;
