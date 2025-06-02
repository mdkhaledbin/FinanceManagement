"use client";
import MainContent from "@/components/MainContent";
import Navbar from "@/components/Navbar";
import SideBar from "@/components/SideBarComps/SideBar";
import ToggleChat from "@/components/ToggleChat";
import { DataProvider } from "@/context/DataProviderReal";
import { SelectedTableProvider } from "@/context/SelectedTableProvider";
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
      <DataProvider>
        <SelectedTableProvider>
          <div className="flex overflow-hidden">
            <Navbar isOpen={showSidebar} setIsOpen={setShowSidebar} />
            <ToggleChat onToggle={handleShowChat} />
            <SideBar isOpen={showSidebar} setIsOpen={setShowSidebar} />
            <div className="flex-1 overflow-x-auto">
              <MainContent showChat={showChatArea} />
            </div>
          </div>
        </SelectedTableProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default Page;
