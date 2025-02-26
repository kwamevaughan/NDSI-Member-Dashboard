import React, { useState, useEffect, useRef } from 'react';
import { Bars3Icon, XMarkIcon, MoonIcon, SunIcon, MagnifyingGlassIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react'; // Import Icon from @iconify/react

const Header = ({ toggleSidebar, isSidebarOpen, mode, toggleMode, onLogout }) => {
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

    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Guest';

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-sm border-b ${
                mode === 'dark' ? 'border-[#8DC63F] bg-[#0a0c1d] text-white' : 'border-gray-300 bg-[#ececec] text-black'
            } ${isSidebarOpen ? 'md:ml-[300px]' : 'md:ml-[80px]'} backdrop-blur-md bg-opacity-30`}
        >
            <div className="flex items-center justify-between p-2 md:p-4">
                {/* Left Section: Logo, Toggle, and Search (Desktop) */}
                <div className="flex items-center space-x-2">
                    <div className={`${isSidebarOpen ? 'hidden md:hidden' : 'block'}`}>
                        <Image
                            src={mode === 'dark' ? '/assets/images/logo-white.svg' : '/assets/images/logo.svg'}
                            alt="Logo"
                            width={120}
                            height={40}
                            className="w-32 md:w-[200px]"
                        />
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 focus:outline-none"
                        aria-label="Toggle sidebar"
                    >
                        {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </button>
                    <div className="flex items-center space-x-2">
                        {isSearchOpen ? (
                            <form onSubmit={handleSearch} className="relative flex-grow md:flex-grow-0 md:w-96">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for resources"
                                    className={`w-full pl-10 pr-10 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-[#8DC63F] ${
                                        mode === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-black text-[#403F41]'
                                    }`}
                                    style={{
                                        fontWeight: 'bold', // Make placeholder text bold
                                    }}
                                />
                                <MagnifyingGlassIcon
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                                        mode === 'dark' ? 'text-gray-400' : 'text-[#403F41]'
                                    }`}
                                />
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                                    aria-label="Close search"
                                >
                                    <XMarkIcon className="h-5 w-5"/>
                                </button>
                            </form>

                        ) : (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="p-2 focus:outline-none md:hidden"
                                aria-label="Open search"
                            >
                                <MagnifyingGlassIcon className="h-6 w-6"/>
                            </button>
                        )}
                        <form onSubmit={handleSearch} className="hidden md:block relative w-96">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for resources"
                                className={`w-full pl-10 pr-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-[#8DC63F] ${
                                    mode === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-black text-[#403F41]'
                                }`}
                            />
                            <MagnifyingGlassIcon
                                className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                                    mode === 'dark' ? 'text-gray-400' : 'text-[#403F41]'
                                }`}
                            />
                        </form>
                    </div>
                </div>

                {/* Right Section: Dark Mode, User */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={toggleMode}
                        className="p-2 focus:outline-none md:hidden"
                        aria-label="Toggle dark mode"
                    >
                        {mode === 'dark' ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                    </button>
                    <label className="hidden md:inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={mode === 'dark'} onChange={toggleMode} className="hidden" />
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
                                    <MoonIcon className="h-6 w-6 text-gray-700" />
                                ) : (
                                    <SunIcon className="h-6 w-6 text-yellow-500" />
                                )}
                            </div>
                        </div>
                    </label>

                    <div className="flex items-center gap-2 relative group cursor-default" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)}>
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
                                <span className="text-[#403F41] font-bold">{fullName}</span>
                                <span className="block text-sm font-normal text-[#28A8E0]">Member</span>
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
                                    <div className="flex items-center gap-2 border-b pb-6 w-full transition-all duration-500 ease-out transform hover:-translate-y-[10px]">
                                        <div className="rounded-full overflow-hidden flex-shrink-0">
                                            <Image
                                                src={user?.profile_image || '/assets/images/placeholder.png'}
                                                alt="User Profile"
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-md font-bold">{fullName}</span>
                                            <span className="text-sm">Customer</span>
                                            <div className="flex items-center justify-center gap-2">
                                                <EnvelopeIcon className="h-4 w-4" />
                                                <span className="text-sm">{user?.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link href="/profile">
                                        <div className="flex gap-2 capitalize py-6 transition-all duration-500 ease-out transform hover:-translate-y-[10px]">
                                            <LockClosedIcon className="bg-[#e7f8f7] text-[#28A8E0] rounded-full p-2 h-10 w-10" />
                                            <div className="flex flex-col">
                                                <span className="text-md font-bold">My Profile</span>
                                                <span className="text-sm">Account Settings</span>
                                            </div>
                                        </div>
                                    </Link>

                                    <button
                                        onClick={onLogout}
                                        className={`block w-full text-center text-white px-4 py-2 bg-[#28A8E0] rounded-full transition-all duration-500 ease-out transform hover:-translate-y-[10px] ${
                                            mode === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-[#8DC63F]'
                                        }`}
                                    >
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
