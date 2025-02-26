import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';

const ESGToolkit = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
    const { user } = useUser();

    return (
        <main
            className={`transition-all duration-300 shadow-md hover:shadow-none rounded-xl overflow-hidden ${
                mode === 'dark'
                    ? 'border-[#8DC63F] bg-[#19506a] text-white'  // Dark mode - dark teal background, white text
                    : 'border-gray-300 bg-white text-black'    // Light mode - white background, black text
            } h-full`}  // Full height for the container
        >
            <div className="flex flex-col justify-between p-8 h-full">  {/* Full height for content */}
                <div className="mb-4">
                    <Icon icon="healthicons:medium-bars" className={`text-5xl ${mode === 'dark' ? 'text-sky-400' : 'text-sky-500'}`}/>
                </div>
                <h3 className={`font-bold text-xl mb-4 ${mode === 'dark' ? 'text-white' : 'text-black'}`}>ESG Toolkit</h3>
                <p className={`mb-6 ${mode === 'dark' ? 'text-white' : 'text-black'}`}>Practical tools and frameworks for integrating ESG principles into your business.</p>

                <div className={`w-full rounded-full h-2.5 mb-4 ${mode === 'dark' ? 'bg-gray-700' : 'bg-sky-200'}`}>
                    <div className="bg-sky-500 h-2.5 rounded-full" style={{width: '65%'}}></div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex flex-col text-gray-600">
                        <span className={`font-bold text-xl mb-1 ${mode === 'dark' ? 'text-white' : 'text-black'}`}>65%</span>
                        <span className={`${mode === 'dark' ? 'text-white' : 'text-black'}`}>Toolkit Usage</span>
                    </div>

                    <button
                        className={`transition-all duration-300 hover:bg-sky-500 bg-lime-500 text-white px-4 py-2 self-end rounded-full hover:translate-y-[-5px] 
                            ${mode === 'dark' ? 'hover:bg-sky-400' : 'hover:bg-sky-600'}`}
                    >
                        View Documents
                    </button>
                </div>
            </div>
        </main>
    );
};

export default ESGToolkit;
