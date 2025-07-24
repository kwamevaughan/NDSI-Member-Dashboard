import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import toast from 'react-hot-toast';
import { useTheme } from '@/hooks/useTheme';
import { useUser } from '@/context/UserContext';
import useSignOut from '@/hooks/useSignOut';
import ESGToolkitEmbed from '@/components/ESGToolkitEmbed';
import useSidebar from '@/hooks/useSidebar';
import ESGToolkit from '@/components/ESGToolkit';
import { Icon } from '@iconify/react';

// Accept mode and toggleMode as props
const ESGToolkitPage = () => {
    const router = useRouter();
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const notify = (message) => toast(message);
    const { handleSignOut } = useSignOut();
    const { user } = useUser();
    const { mode, toggleMode } = useTheme();

    // Check if user is pending approval
    useEffect(() => {
        if (user && !user.is_approved) {
            toast.error('Your account is pending approval. Content will be available once your account is approved.', {
                duration: 4000,
                position: 'top-center',
            });
            router.replace('/dashboard');
        }
    }, [user, router]);

    // Don't render if user is pending approval
    if (user && !user.is_approved) {
        return null;
    }

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
              className={`flex flex-col items-center justify-center h-full w-full min-h-screen ${
                mode === "dark"
                  ? "bg-[#0a0c1d] text-white"
                  : "bg-[#ececec] text-black"
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full w-full py-24">
                <div className="mb-8">
                  <Icon
                    icon="mdi:alert-circle-outline"
                    width="96"
                    height="96"
                    className="text-ndsi-blue"
                  />
                </div>
                <h2
                  className="text-4xl font-bold mb-4 text-center"
                  style={{ color: mode === "dark" ? "#28A8E0" : "#172840" }}
                >
                  ESG Toolkit
                  <br />
                  Coming Soon
                </h2>
                <p className="text-lg text-center max-w-xl mb-8 text-gray-500 dark:text-gray-300">
                  We&apos;re finalizing the ESG Toolkit content to ensure you
                  get the best resources and experience. Please check back soon!
                </p>
                <div className="flex justify-center">
                  <span className="inline-block animate-bounce rounded-full bg-[#28A8E0] dark:bg-[#172840] h-4 w-4 mr-2"></span>
                  <span
                    className="inline-block animate-bounce rounded-full bg-[#28A8E0] dark:bg-[#172840] h-4 w-4 mr-2"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="inline-block animate-bounce rounded-full bg-[#28A8E0] dark:bg-[#172840] h-4 w-4"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </div>
              </div>
              {/* <ESGToolkitEmbed /> */}
            </main>
          </div>
        </div>
      </div>
    );
};

export default ESGToolkitPage;