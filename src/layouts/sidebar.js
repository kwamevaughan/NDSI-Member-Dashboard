import { useEffect, useState, useRef } from 'react';
import { ArrowRightStartOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';

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

    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Guest';

    return (
        <div
            ref={sidebarRef}
            className={`fixed left-0 top-0 z-50 h-full transition-all duration-300 ${
                mode === 'dark' ? 'text-white' : 'text-black'
            }`}
            style={{
                width: isOpen ? '300px' : windowWidth < 640 ? '0' : '80px',
                backgroundColor:
                    mode === 'dark' && windowWidth < 640
                        ? 'rgba(40, 168, 224, 1)' // Full blue on mobile in dark mode
                        : mode === 'dark'
                            ? 'rgba(40, 168, 224, 0.3)' // Translucent blue on desktop in dark mode
                            : 'white', // White in light mode
            }}
        >
            <div className="flex flex-col h-full" style={{ backgroundColor: 'rgba(40, 168, 224, 0.3)' }}>
                {/* Logo */}
                <div className={`flex flex-col items-center py-10 ${isOpen ? 'px-4' : 'px-0'}`}>
                    {isOpen ? (
                        <Link href="/">
                            <Image
                                src={mode === 'dark' ? '/assets/images/logo-white.svg' : '/assets/images/logo.svg'}
                                alt="NDSI Logo"
                                width={200}
                                height={75}
                            />
                        </Link>
                    ) : (
                        <Link href="/">
                            <Image src="/favicon.png" alt="NDSI Logo" width={40} height={40} />
                        </Link>
                    )}
                </div>

                {/* Navigation */}
                <ul className="flex-grow">
                    {[
                        { href: '/dashboard', icon: 'ri:home-line', label: 'NDSI Home' },
                        {
                            href: '/strategic-documents',
                            icon: 'majesticons:document-line',
                            label: 'NDSI Strategic Documents',
                        },
                        {
                            href: '/training-materials',
                            icon: 'healthicons:i-training-class-outline-24px',
                            label: 'Training Materials',
                        },
                        { href: '/newsletter', icon: 'quill:inbox-newsletter', label: 'Newsletter' },
                        { href: '/working-group-docs', icon: 'pixelarticons:group', label: 'Working Group Docs' },
                        { href: '/esg-toolkit', icon: 'mdi:briefcase-outline', label: 'ESG Toolkit' },
                    ].map(({ href, icon, label }) => (
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
                                    <ArrowRightStartOnRectangleIcon className="h-8 w-8" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-full relative group">
                                <button
                                    onClick={onLogout}
                                    className="flex items-center justify-center text-red-500 hover:text-red-600"
                                    aria-label="Logout"
                                >
                                    <ArrowRightStartOnRectangleIcon className="h-6 w-6" />
                                </button>
                                <span className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap">
                                    Sign Out
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Toggle Button - Only show on desktop */}
                {windowWidth >= 640 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                        <button
                            onClick={toggleSidebar}
                            className={`w-full flex items-center justify-center p-2 rounded-lg transition-all duration-300 hover:bg-[#28A8E0] hover:text-white ${
                                mode === 'dark' ? 'text-white hover:bg-[#28A8E0]' : 'text-[#403F41] hover:bg-[#28A8E0]'
                            }`}
                            aria-label="Toggle sidebar"
                        >
                            {isOpen ? (
                                <>
                                    <XMarkIcon className="h-5 w-5 mr-2" />
                                    <span>Collapse</span>
                                </>
                            ) : (
                                <>
                                    <Bars3Icon className="h-5 w-5 mr-2" />
                                    <span>Expand</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;