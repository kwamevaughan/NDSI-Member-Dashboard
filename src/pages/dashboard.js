// src/pages/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from 'lib/supabase';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import { toast } from 'react-toastify';
import useTheme from '@/hooks/useTheme';
import useSidebar from '@/hooks/useSidebar';
import useModal from '@/hooks/useModal';
import useSignOut from '@/hooks/useSignOut';

const Dashboard = () => {
    const router = useRouter();
    const { mode, toggleMode } = useTheme();
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const { isOpen: isVerificationModalOpen, openModal: openVerificationModal, closeModal: closeVerificationModal } = useModal();
    const notify = (message) => toast(message);
    const { handleSignOut } = useSignOut();

    const handleDownloadApp = (message) => notify(message, 'success');

    const openModal = () => {};
    const closeModal = () => {};

    return (
        <div className={`flex flex-col h-screen ${mode === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#f7f1eb]'}`}>
            <Header
                toggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
                mode={mode}
                toggleMode={toggleMode}
                onLogout={handleSignOut}
            />
            <div className="flex flex-1 transition-all duration-300">
                <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    mode={mode}
                    onLogout={handleSignOut}
                    openModal={openModal}
                    openVerificationModal={openVerificationModal}
                    toggleMode={toggleMode}
                />
                <main
                    className={`flex-1 p-4 md:p-8 pt-14 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'ml-10 lg:ml-20'} ${mode === 'dark' ? 'bg-[#0a0c1d] text-white' : 'bg-[#f7f1eb] text-black'} w-full`}
                >
                    <div className="space-y-6">
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`${mode === 'dark' ? 'bg-[#101720] text-white' : 'bg-white text-black'} rounded-lg hover:shadow-md transition-all duration-300 ease-in-out`}></div>
                                <div className={`${mode === 'dark' ? 'bg-[#101720] text-white' : 'bg-[#0CB4AB] text-black'} rounded-lg hover:shadow-md transition-all duration-300 ease-in-out`}></div>
                            </div>
                        </div>
                        <div className="pt-12">
                            <h2 className="text-4xl font-bold text-teal-600 mb-4 text-center">Leaderboard</h2>
                            <h3 className="text-2xl font-bold text-[#ff9409] mb-4 text-center">See Who's Leading the Pack!</h3>
                            <p className="mb-4 text-center">Stay competitive! Check the live leaderboard to see who's winning.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;