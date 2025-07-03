import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';
import navLinks from '@/data/nav';

const Sidebar = ({ isOpen, mode, onLogout, toggleSidebar }) => {
    const { user } = useUser();
    const [windowWidth, setWindowWidth] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const router = useRouter();
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        if (typeof window !== 'undefined') {
            handleResize();
            window.addEventListener('resize', handleResize);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', handleResize);
            }
        };
    }, []);

    useEffect(() => {
        setProfileImage(user?.profile_image);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target) &&
                isOpen &&
                windowWidth < 640 // Only on mobile
            ) {
                toggleSidebar(); // Close sidebar
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, windowWidth, toggleSidebar]);

    const isActive = (pathname) =>
        router.pathname === pathname
            ? 'bg-[#8DC63F] text-white'
            : mode === 'dark'
                ? 'text-white'
                : 'text-black';

    if (windowWidth === null) return null;

    const fullName = user ? `${user.full_name || ''}`.trim() : 'Guest';

    return (
        <div
            ref={sidebarRef}
            className={`fixed left-0 top-0 z-50 h-full transition-all duration-300 ${
                mode === 'dark' ? 'text-white' : 'text-black'
            }`}
            style={{
                width: isOpen ? '250px' : windowWidth < 640 ? '0' : '80px',
                backgroundColor:
                    mode === 'dark' && windowWidth < 640
                        ? 'rgba(40, 168, 224, 1)' // Full blue on mobile in dark mode
                        : mode === 'dark'
                            ? 'rgba(40, 168, 224, 0.3)' // Translucent blue on desktop in dark mode
                            : 'white', // White in light mode
            }}
        >
            <div className="flex flex-col h-full" style={{ backgroundColor: 'rgba(40, 168, 224, 0.3)' }}>
                {/* Logo and Toggle Section */}
                <div className={`flex flex-col items-center py-6 ${isOpen ? 'px-4' : 'px-0'}`}>
                    <div className="flex items-center justify-between w-full">
                        {isOpen ? (
                            <>
                                <Link href="/">
                                    <Image
                                        src={mode === 'dark' ? '/assets/images/logo-white.svg' : '/assets/images/logo.svg'}
                                        alt="NDSI Logo"
                                        width={150}
                                        height={75}
                                    />
                                </Link>
                                <button
                                    onClick={toggleSidebar}
                                    className={`p-2 rounded-lg transition-all duration-300 hover:bg-[#28A8E0] hover:text-white ${
                                        mode === 'dark' ? 'text-white hover:bg-[#28A8E0]' : 'text-[#403F41] hover:bg-[#28A8E0]'
                                    }`}
                                    aria-label="Collapse sidebar"
                                >
                                    <Icon icon="heroicons:chevron-left" className="h-5 w-5" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/">
                                    <Image src="/favicon.png" alt="NDSI Logo" width={40} height={40} />
                                </Link>
                                <button
                                    onClick={toggleSidebar}
                                    className={`p-2 rounded-lg transition-all duration-300 hover:bg-[#28A8E0] hover:text-white ${
                                        mode === 'dark' ? 'text-white hover:bg-[#28A8E0]' : 'text-[#403F41] hover:bg-[#28A8E0]'
                                    }`}
                                    aria-label="Expand sidebar"
                                >
                                    <Icon icon="heroicons:chevron-right" className="h-5 w-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <ul className="flex-grow">
                    {navLinks.map(({ href, icon, label }) => (
                        <li key={href} className="py-2">
                            <Link
                                href={href}
                                className={`flex items-center font-normal ${
                                    isOpen ? 'justify-start px-8' : 'justify-center px-0'
                                } py-2 hover:bg-[#28A8E0] hover:text-white hover:-translate-y-[10px] hover:shadow-lg transition-all duration-300 group relative ${isActive(
                                    href
                                )}`}
                            >
                                <Icon
                                    icon={icon}
                                    className={`${isOpen ? 'h-8 w-8 mr-2' : 'h-6 w-6'} rounded-full transition ${
                                        router.pathname === href
                                            ? 'text-white'
                                            : mode === 'dark'
                                                ? 'text-white group-hover:text-white'
                                                : 'text-[#403F41] group-hover:text-white'
                                    }`}
                                />
                                {isOpen && <span>{label}</span>}
                                {!isOpen && (
                                    <span className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap">
                                        {label}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* User Section - Hidden on mobile when sidebar is collapsed */}
                {(!isOpen && windowWidth < 640) ? null : (
                    <div
                        className={`flex items-center justify-between px-4 py-4 mt-auto rounded-2xl ${
                            mode === 'dark' ? 'bg-[#18506b]' : 'bg-[#b7e6ff]'
                        } ${windowWidth >= 640 && mode === 'dark' ? 'bg-[#18506b]' : ''}`}
                    >
                        {isOpen ? (
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden">
                                        <Image
                                            src={profileImage || '/assets/images/placeholder.png'}
                                            alt="Profile"
                                            width={40}
                                            height={40}
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className={`text-md ${mode === 'dark' ? 'text-white' : 'text-black'}`}>
                                        {fullName}
                                    </span>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center justify-center text-red-500 hover:text-red-600"
                                    aria-label="Logout"
                                >
                                    <Icon icon="heroicons:arrow-right-start-on-rectangle" className="h-8 w-8" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full relative group">
                                <button
                                    onClick={onLogout}
                                    className="flex items-center justify-center text-red-500 hover:text-red-600"
                                    aria-label="Logout"
                                >
                                    <Icon icon="heroicons:arrow-right-start-on-rectangle" className="h-6 w-6" />
                                </button>
                                <span className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap">
                                    Sign Out
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;