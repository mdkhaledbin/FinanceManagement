"use client";
import MainContent from "@/components/MainContent";
import Navbar from "@/components/Navbar";
import SideBar from "@/components/SideBarComps/SideBar";
import ToggleChat from "@/components/ToggleChat";
import { ThemeProvider } from "@/context/ThemeProvider";
import { useState } from "react";

const Page = () => {
  const [showChatArea, setShowChatArea] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleShowChat = () => {
    setShowChatArea(!showChatArea);
  };

  return (
    <ThemeProvider>
      <div className="flex">
        <Navbar isOpen={showSidebar} setIsOpen={setShowSidebar} />
        <ToggleChat onToggle={handleShowChat} />
        <SideBar isOpen={showSidebar} setIsOpen={setShowSidebar} />
        <div className="flex-1">
          <MainContent showChat={showChatArea} />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Page;
