import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import toast from 'react-hot-toast';
import useTheme from '@/hooks/useTheme';
import useSidebar from '@/hooks/useSidebar';
import useSignOut from '@/hooks/useSignOut';
import { useUser } from '@/context/UserContext';
import StrategicDocuments from '@/components/StrategicDocuments';
import TrainingMaterials from "@/components/TrainingMaterials";
import ESGToolkit from "@/components/ESGToolkit";
import Newsletter from "@/components/Newsletter";
import WorkingGroupDocumentation from "@/components/WorkingGroupDocumentation";
import Link from 'next/link';
import { Icon } from '@iconify/react';

const Dashboard = () => {
    const router = useRouter();
    const { mode, toggleMode } = useTheme();
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const notify = (message) => toast(message);
    const { handleSignOut } = useSignOut();
    const { user } = useUser();

    useEffect(() => {
        if (!user) return;
        
        // Check if first time, or missing required info
        const needsFirstTimeSetup = user.is_first_time || !user.first_name || !user.last_name || !user.password;
        if (needsFirstTimeSetup) {
            router.replace('/first-time-setup');
            return;
        }

        // Show pending approval notification if user is not approved
        if (!user.is_approved) {
            toast.error('Your account is pending approval. You can view the dashboard but cannot access content until approved.', {
                duration: 6000,
                position: 'top-center',
            });
        }
    }, [user, router]);

    if (!user || user.is_first_time || !user.first_name || !user.last_name || !user.password) {
        // Optionally show a loading spinner or nothing while redirecting
        return null;
    }

    const isPendingApproval = !user.is_approved;

    const firstName = user?.first_name || 'Guest';

    return (
      <div
        className={`flex flex-col h-full ${
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
              className={`p-4 md:p-8 ${
                isSidebarOpen
                  ? "pt-[60px] md:pt-[70px]"
                  : "pt-[80px] md:pt-[120px]" // Increased padding when sidebar is hidden
              } ${
                mode === "dark"
                  ? "bg-[#0a0c1d] text-white"
                  : "bg-[#ececec] text-black"
              } w-full min-h-screen`}
            >
              {/* Pending Approval Banner */}
              {isPendingApproval && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon icon="mdi:clock-outline" className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                        Account Pending Approval
                      </h3>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Your account is currently under review. You can preview the dashboard below, but content access will be enabled once your account is approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6 ">
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`${
                        mode === "dark"
                          ? "bg-[#101720] text-white"
                          : "bg-white text-black"
                      } rounded-lg hover:shadow-md transition-all duration-300 ease-in-out`}
                    ></div>
                    <div
                      className={`${
                        mode === "dark"
                          ? "bg-[#101720] text-white"
                          : "bg-[#0CB4AB] text-black"
                      } rounded-lg hover:shadow-md transition-all duration-300 ease-in-out`}
                    ></div>
                  </div>
                </div>
                <h2 className="text-4xl font-semibold text-[#28A8E0] mb-4">
                  Welcome {user.full_name} to NDSI!
                </h2>
                <p className="mb-4">
                  Explore resources, training, and key strategic documents to
                  support sustainability efforts.
                </p>
              </div>

              <div className={`grid pt-14 pb-14 gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 h-full ${isPendingApproval ? 'pointer-events-none opacity-50' : ''}`}>
                {isPendingApproval ? (
                  // Disabled preview cards
                  <>
                    <div className="w-full flex-grow transition-all duration-300 block relative">
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Icon icon="mdi:lock" className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">Content locked</p>
                        </div>
                      </div>
                      <StrategicDocuments mode={mode} />
                    </div>
                    <div className="w-full flex-grow transition-all duration-300 block relative">
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Icon icon="mdi:lock" className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">Content locked</p>
                        </div>
                      </div>
                      <TrainingMaterials mode={mode} />
                    </div>
                    <div className="w-full flex-grow transition-all duration-300 block relative">
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Icon icon="mdi:lock" className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">Content locked</p>
                        </div>
                      </div>
                      <ESGToolkit mode={mode} />
                    </div>
                    <div className="w-full flex-grow transition-all duration-300 block relative">
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Icon icon="mdi:lock" className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-300">Content locked</p>
                        </div>
                      </div>
                      <Newsletter mode={mode} />
                    </div>
                  </>
                ) : (
                  // Normal clickable links
                  <>
                    <Link href="/strategic-documents" className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300 block" style={{textDecoration: 'none'}}>
                      <StrategicDocuments mode={mode} />
                    </Link>
                    <Link href="/training-materials" className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300 block" style={{textDecoration: 'none'}}>
                      <TrainingMaterials mode={mode} />
                    </Link>
                    <Link href="/esg-toolkit" className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300 block" style={{textDecoration: 'none'}}>
                      <ESGToolkit mode={mode} />
                    </Link>
                    <Link href="/newsletter" className="w-full flex-grow hover:translate-y-[-5px] transition-all duration-300 block" style={{textDecoration: 'none'}}>
                      <Newsletter mode={mode} />
                    </Link>
                  </>
                )}
              </div>

              <div className={`grid pb-14 gap-8 grid-cols-1 h-full ${isPendingApproval ? 'pointer-events-none opacity-50' : ''}`}>
                {isPendingApproval ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center z-10">
                      <div className="text-center">
                        <Icon icon="mdi:lock" className="w-8 h-8 text-gray-500 dark:text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">Content locked</p>
                      </div>
                    </div>
                    <WorkingGroupDocumentation mode={mode} />
                  </div>
                ) : (
                  <WorkingGroupDocumentation mode={mode} />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
};

export default Dashboard;