import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';

const StrategicDocuments = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
    const { user } = useUser();

    return (
        <main
            className={`transition-all duration-300 shadow-md hover:shadow-none bg-white rounded-xl overflow-hidden ${
                mode === 'dark' ? 'border-[#8DC63F] bg-[#0a0c1d] text-white' : 'border-gray-300 bg-[#ececec] text-black'
            } h-full`}  // Add h-full to take full height
        >
            <div className="flex flex-col justify-between p-8 h-full">  {/* Add h-full to ensure full height */}
                <div className="mb-4">
                    <Icon icon="fe:document" className="text-5xl text-sky-500"/>
                </div>
                <h3 className="main-gray font-bold text-xl mb-4">NDSI Strategic Documents</h3>
                <p className="mb-6">Access key documents including the NDSI Charter, strategy, and official logos.</p>
                <button
                    className="transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-end rounded-full hover:translate-y-[-5px]"
                >
                    View Documents
                </button>
            </div>
        </main>

    );
};

export default StrategicDocuments;
