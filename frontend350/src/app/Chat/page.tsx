"use client";
import MainContent from "@/components/MainContent";
import SideBar from "@/components/SideBar";
import ToggleChat from "@/components/ToggleChat";
import { useState } from "react";

const Page = () => {
  const [showChatArea, setShowChatArea] = useState(false);
  const handleShowChat = () => {
    setShowChatArea(!showChatArea);
  };
  return (
    <div className="flex">
      <ToggleChat onToggle={handleShowChat} />
      <SideBar />
      <div className="flex-1">
        <MainContent showChat={showChatArea} />
      </div>
    </div>
  );
};

export default Page;
