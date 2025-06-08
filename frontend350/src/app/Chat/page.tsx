"use client";
import MainContent from "@/components/MainContent";
import Navbar from "@/components/Navbar";
import SideBar from "@/components/SideBarComps/SideBar";
import ToggleChat from "@/components/ToggleChat";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DataProvider } from "@/context/DataProviderReal";
import { SelectedTableProvider } from "@/context/SelectedTableProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AuthProvider } from "@/context/AuthProvider";
import { useState } from "react";

const ChatPageContent = () => {
  const [showChatArea, setShowChatArea] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const handleShowChat = () => {
    setShowChatArea(!showChatArea);
  };

  return (
    <ProtectedRoute>
      <div className="flex overflow-hidden">
        <Navbar isOpen={showSidebar} setIsOpen={setShowSidebar} />
        <ToggleChat onToggle={handleShowChat} />
        <SideBar isOpen={showSidebar} setIsOpen={setShowSidebar} />
        <div className="flex-1 overflow-x-auto">
          <MainContent showChat={showChatArea} />
        </div>
      </div>
    </ProtectedRoute>
  );
};

const Page = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <SelectedTableProvider>
            <ChatPageContent />
          </SelectedTableProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default Page;
