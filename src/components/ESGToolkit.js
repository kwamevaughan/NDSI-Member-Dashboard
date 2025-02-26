import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';

const ESGToolkit = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
    const { user } = useUser();

    return (
        <main
            className={`transition-all duration-300 shadow-md hover:shadow-none bg-white rounded-xl overflow-hidden ${
                mode === 'dark' ? 'border-[#8DC63F] bg-[#0a0c1d] text-white' : 'border-gray-300 bg-[#ececec] text-black'
            } h-full`}  // Add h-full to take full height
        >
            <div className="flex flex-col justify-between p-8 h-full">  {/* Add h-full to ensure full height */}
                <div className="mb-4">
                    <Icon icon="healthicons:medium-bars" className="text-5xl text-sky-500"/>
                </div>
                <h3 className="main-gray font-bold text-xl mb-4">ESG Toolkit</h3>
                <p className="mb-6">Practical tools and frameworks for integrating ESG principles into your
                    business.</p>
                <div className="w-full bg-sky-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                    <div className="bg-sky-500 h-2.5 rounded-full" style={{width: '65%'}}></div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex flex-col text-gray-600">
                        <span className="font-bold text-xl mb-1">65%</span>
                        <span>Completion</span>
                    </div>

                    <button
                        className="transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-end rounded-full hover:translate-y-[-5px]"
                    >
                        View Documents
                    </button>
                </div>
                </div>
        </main>

);
};

export default ESGToolkit;
