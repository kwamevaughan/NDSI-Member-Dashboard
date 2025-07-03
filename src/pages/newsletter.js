import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import toast from 'react-hot-toast';
import useTheme from '@/hooks/useTheme';
import useSidebar from '@/hooks/useSidebar';
import { useUser } from '@/context/UserContext';
import useSignOut from '@/hooks/useSignOut';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import { listFilesInFolder } from '@/utils/imageKitService';
import SimpleModal from '@/components/SimpleModal';
import DocumentGrid from '@/components/DocumentGrid';


const NewsletterPage = () => {
    const router = useRouter();
    const { mode, toggleMode } = useTheme();
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const notify = (message) => toast(message);
    const { handleSignOut } = useSignOut();
    const { user } = useUser();


    return (
      <div
        className={`flex flex-col h-screen ${
          mode === "dark" ? "bg-[#1a1a1a]" : "bg-[#f7f1eb]"
        }`}
      >
        <Header
          isSidebarOpen={isSidebarOpen}
          mode={mode}
          toggleMode={toggleMode}
          onLogout={handleSignOut}
        />
        <div className="flex flex-1">
          <Sidebar
            isOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            mode={mode}
            onLogout={handleSignOut}
            toggleMode={toggleMode}
          />
          <div
            className={`flex-1 transition-margin duration-300 ${
              isSidebarOpen ? "lg:ml-[250px]" : "ml-0 lg:ml-[80px]"
            }`}
          >
            <main
              className={`p-4 md:p-8 mt-10 ${
                isSidebarOpen
                  ? "pt-[60px] md:pt-[70px]"
                  : "pt-[80px] md:pt-[120px]" // Increased padding when sidebar is hidden
              } ${
                mode === "dark"
                  ? "bg-[#0a0c1d] text-white"
                  : "bg-[#ececec] text-black"
              } w-full min-h-screen`}
            >
              <DocumentGrid
                folder="Newsletters"
                title="Newsletters"
                description="Browse and filter newsletters below."
                mode={mode}
              />
            </main>
          </div>
        </div>
      </div>
    );
};

export default NewsletterPage;