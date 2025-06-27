import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';

const Header = ({ isSidebarOpen, mode, toggleMode, onLogout }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);
    const { user } = useUser();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Search query:', searchQuery);
        // Add search logic here if needed
    };

    const fullName = user ? `${user.full_name || ''}`.trim() : 'Guest';

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-sm border-b ${
                mode === 'dark' ? 'border-[#8DC63F] bg-[#0a0c1d] text-white' : 'border-gray-300 bg-[#ececec] text-black'
            } ${isSidebarOpen ? 'md:ml-[300px]' : 'md:ml-[80px]'} backdrop-blur-md bg-opacity-30`}
        >
            <div className="flex items-center justify-between p-2 md:p-4">
                {/* Left Section: Logo and Search (Desktop) */}
                <div className="flex items-center space-x-10">
                    <div className={`${isSidebarOpen ? 'hidden md:hidden' : 'block'}`}>
                        <Image
                            src={mode === 'dark' ? '/assets/images/logo-white.svg' : '/assets/images/logo.svg'}
                            alt="Logo"
                            width={120}
                            height={40}
                            className="w-32 md:w-[200px]"
                        />
                    </div>
                    
                    {/* Search Bar */}
                    <div className="hidden md:flex items-center space-x-2">
                        <form onSubmit={handleSearch} className="relative">
                            <div className="relative">
                                <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for resources"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-96 pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#28A8E0] ${
                                        mode === 'dark'
                                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-black placeholder-gray-500'
                                    }`}
                                />
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Section: Theme Toggle, Notifications, and User Profile */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleMode}
                        className="p-2 focus:outline-none md:hidden"
                        aria-label="Toggle dark mode"
                    >
                        {mode === 'dark' ? <Icon icon="heroicons:sun" className="h-2 w-2"/> : <Icon icon="heroicons:moon" className="h-2 w-2"/>}
                    </button>
                    <label className="hidden md:inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={mode === 'dark'} onChange={toggleMode} className="hidden"/>
                        <div
                            className={`relative w-14 h-8 rounded-full border-2 flex items-center ${
                                mode === 'dark' ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-gray-300'
                            } transition`}
                        >
                            <div
                                className={`absolute w-6 h-6 rounded-full bg-white flex items-center justify-center transition-transform ${
                                    mode === 'dark' ? 'translate-x-6' : ''
                                }`}
                            >
                                {mode === 'dark' ? (
                                    <Icon icon="heroicons:moon" className="h-6 w-6 text-gray-700"/>
                                ) : (
                                    <Icon icon="heroicons:sun" className="h-6 w-6 text-yellow-500"/>
                                )}
                            </div>
                        </div>
                    </label>

                    <div className="flex items-center gap-2 relative group cursor-default" ref={dropdownRef}
                         onClick={() => setDropdownOpen(!dropdownOpen)}>
                        <div className="flex items-center gap-2 cursor-pointer">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                <Image
                                    src={user?.profile_image || '/assets/images/placeholder.png'}
                                    alt="User Profile"
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                />
                            </div>
                            <div className="hidden md:block">
                                <span
                                    className={`font-semibold ${mode === 'dark' ? 'text-white' : 'text-[#403F41]'}`}>{fullName}</span>
                                <span
                                    className={`block text-sm font-normal ${mode === 'dark' ? 'text-[#28A8E0]' : 'text-[#28A8E0]'}`}>Member</span>
                            </div>
                            <Icon
                                icon={dropdownOpen ? "bxs:up-arrow" : "bxs:down-arrow"} // Conditional icon based on dropdownOpen state
                                className={`h-5 w-5 font-bold transform transition-transform duration-300 ${mode === 'dark' ? 'text-white' : 'text-[#403F41]'}`}
                            />
                        </div>

                        {dropdownOpen && (
                            <div
                                className={`absolute top-full mt-2 right-0 w-80 rounded-2xl shadow-lg z-10 ${
                                    mode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'
                                } z-50`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-8">
                                    <p className="text-lg mb-6">User Profile</p>
                                    <div
                                        className="flex items-center gap-2 border-b pb-6 w-full transition-all duration-500 ease-out transform hover:-translate-y-[10px]">
                                        <div className="rounded-full overflow-hidden flex-shrink-0">
                                            <Image
                                                src={user?.profile_image || '/assets/images/placeholder.png'}
                                                alt="User Profile"
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{fullName}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Member</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-6">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Icon icon="mdi:account-circle" className="h-6 w-6"/>
                                            <span>Profile Settings</span>
                                        </Link>
                                        <button
                                            onClick={onLogout}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-left"
                                        >
                                            <Icon icon="heroicons:arrow-right-start-on-rectangle" className="h-6 w-6"/>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
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
