import React, { useState, useEffect, useRef } from 'react';
import { Bars3Icon, XMarkIcon, MoonIcon, UserCircleIcon, LockClosedIcon, ChevronDownIcon, SunIcon, ArrowsPointingInIcon as FullScreenIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from "react-toastify";
import { supabase } from '../../lib/supabase';
import { useUser } from '@/context/UserContext';  // Import the context
import useFullScreen from '@/hooks/useFullScreen';  // Import the custom hook

const Header = ({ token, toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleFullScreen = useFullScreen();  // Using the custom hook

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false); // Close dropdown if clicked outside
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className={`rounded-lg transition-all duration-300 shadow-sm border-b ${mode === 'dark' ? 'border-[#ff9409]' : 'border-gray-300'} ${isSidebarOpen ? 'ml-72' : 'lg:ml-28'} ${mode === 'dark' ? 'bg-[#0a0c1d] text-white shadow-lg' : 'bg-white text-black'}`}>
            <div className="flex flex-col md:flex-row items-center justify-between p-4 ml-10 md:ml-0">
                {!isSidebarOpen && (
                    <div className="md:hidden mb-2">
                        <Image
                            src="/assets/images/logo.svg"
                            alt="Logo"
                            width={300}
                            height={75}
                            className="w-[350px] md:w-auto"
                        />
                    </div>
                )}

                <div className="flex items-center space-x-4">
                    {!isSidebarOpen && (
                        <>
                            <div className="hidden md:flex items-center">
                                <Link href="/">
                                    <Image
                                        src="/assets/images/logo.svg"
                                        alt="Logo"
                                        width={250}
                                        height={75}
                                    />
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative flex items-center space-x-2 pt-4 md:pt-0">
                    <div className="group relative hidden md:block">
                        <button onClick={toggleFullScreen}
                                className={`flex items-center justify-center h-10 w-10 rounded-full ${mode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-500'} transition`}>
                            <FullScreenIcon
                                className={`h-6 w-6 ${mode === 'dark' ? 'text-white' : 'text-gray-500'} hover:text-blue-600 transition`}/>
                        </button>
                        <span
                            className={`absolute top-10 left-1/2 transform -translate-x-1/2 text-sm ${mode === 'dark' ? 'text-black bg-white' : 'text-white bg-black'} rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                            Toggle Fullscreen
                        </span>
                    </div>

                    <div className="flex group relative">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={mode === 'dark'} onChange={toggleMode} className="hidden"/>
                            <div
                                className={`relative w-14 h-8 rounded-full border-2 flex items-center ${mode === 'dark' ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-gray-300'} transition`}>
                                <div
                                    className={`absolute w-6 h-6 rounded-full bg-white flex items-center justify-center transition-transform ${mode === 'dark' ? 'translate-x-6' : ''}`}>
                                    {mode === 'dark' ? (
                                        <MoonIcon className="h-6 w-6 text-gray-700"/>
                                    ) : (
                                        <SunIcon className="h-6 w-6 text-yellow-500"/>
                                    )}
                                </div>
                            </div>
                        </label>
                    </div>

                    <div className="flex items-center gap-2 relative group cursor-default" ref={dropdownRef}
                         onClick={() => setDropdownOpen(!dropdownOpen)}>
                        <div className="flex items-center gap-2 cursor-pointer">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                {/*<Image src={profileImage || '/assets/images/placeholder.png'} alt="User Profile"*/}
                                {/*       width={48} height={48} className="object-cover"/>*/}
                            </div>
                            {/*<span>{userName || "John Doe"}</span>*/}
                            <ChevronDownIcon className={`h-5 w-5 ${mode === 'dark' ? 'text-white' : 'text-gray-500'}`}/>
                        </div>

                        {dropdownOpen && (
                            <div
                                className={`absolute top-full mt-2 right-0 w-80 rounded-2xl shadow-lg z-10 ${mode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} z-50`}
                                onClick={(e) => e.stopPropagation()}>
                                <div className="p-8">
                                    <p className="text-lg mb-6">User Profile</p>
                                    <div className="flex items-center gap-2 border-b pb-6 w-full transition-all duration-500 ease-out transform hover:-translate-y-[10px]">
                                        <div
                                            className="rounded-full overflow-hidden flex-shrink-0">  {/* Prevent shrinking */}
                                            <Image
                                                src={profileImage || '/assets/images/placeholder.png'}
                                                alt="User Profile"
                                                width={40}
                                                height={0}
                                                className="object-cover"
                                            />
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-md font-bold">{userName || "John Doe"}</span>
                                            <span className="text-sm">Customer</span>
                                            <div className="flex items-center justify-center gap-2">
                                                <EnvelopeIcon className="h-4 w-4"/>
                                                <span className="text-sm">{userEmail || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>


                                    <Link href="/profile">
                                        <div
                                            className="flex gap-2 capitalize py-6 transition-all duration-500 ease-out transform hover:-translate-y-[10px]">
                                            <LockClosedIcon
                                                className="bg-[#e7f8f7] text-[#0eb4ab] rounded-full p-2 h-10 w-10"/>
                                            <div className="flex flex-col">
                                                <span className="text-md font-bold">My Profile</span>
                                                <span className="text-sm">Account Settings</span>
                                            </div>
                                        </div>
                                    </Link>

                                    <button onClick={onLogout}
                                            className={`block w-full text-center text-white px-4 py-2 bg-[#0eb4ab] rounded-full transition-all duration-500 ease-out transform hover:-translate-y-[10px] ${mode === 'dark' ? 'text-white' : 'text-gray-800'} ${mode === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-teal-600'}`}>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
};

export default Header;
