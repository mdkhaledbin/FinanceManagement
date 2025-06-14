"use client";
import MainContent from "@/components/MainContent";
import Navbar from "@/components/Navbar";
import SideBar from "@/components/SideBarComps/SideBar";
import ToggleChat from "@/components/ToggleChat";
import { useUser } from "@/context/AuthProvider";
import { DataProvider } from "@/context/DataProviderReal";
import { SelectedTableProvider } from "@/context/SelectedTableProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Page = () => {
  const [showChatArea, setShowChatArea] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && user === null) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (!isClient || loading) return null;
  if (!user) return null;

  const handleShowChat = () => {
    setShowChatArea(!showChatArea);
  };

  return (
    <DataProvider>
      <SelectedTableProvider>
        <div className="flex overflow-hidden transition-all duration-500 ease-in-out">
          <Navbar isOpen={showSidebar} setIsOpen={setShowSidebar} />
          <ToggleChat onToggle={handleShowChat} />
          <SideBar isOpen={showSidebar} setIsOpen={setShowSidebar} />
          <div className="flex-1 overflow-x-auto">
            <MainContent showChat={showChatArea} />
          </div>
        </div>
      </SelectedTableProvider>
    </DataProvider>
  );
};

export default Page;
