import React, { useState, useEffect, useRef } from 'react';
import { Bars3Icon, XMarkIcon, MoonIcon, SunIcon, MagnifyingGlassIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react'; // Import Icon from @iconify/react

const TrainingMaterials = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
    const { user } = useUser();



    return (
        <main
            className={`transition-all duration-300 shadow-md hover:shadow-none bg-white rounded-xl overflow-hidden ${
                mode === 'dark' ? 'border-[#8DC63F] bg-[#0a0c1d] text-white' : 'border-gray-300 bg-[#ececec] text-black'
            } h-full`}  // Add h-full to take full height
        >
            <div className="flex flex-col justify-between p-8 h-full">  {/* Add h-full to ensure full height */}
                <div className="mb-4">
                    <Icon icon="ri:graduation-cap-fill" className="text-5xl text-sky-500"/>
                </div>
                <h3 className="main-gray font-bold text-xl mb-4">NDSI Training Materials</h3>
                <p className="mb-6">Watch training videos and access presentations designed to build capacity.</p>

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

export default TrainingMaterials;
