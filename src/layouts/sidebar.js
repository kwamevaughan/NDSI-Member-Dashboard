import { useEffect, useState } from "react";
import { supabase } from '../../lib/supabase';

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightOnRectangleIcon,
    ArrowRightStartOnRectangleIcon,
    HomeIcon,
    MagnifyingGlassIcon,
    ChartBarIcon,
    ArrowUpOnSquareIcon,
    CogIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    BellIcon,
    CheckBadgeIcon,
    PresentationChartLineIcon,
    StarIcon,
    Bars3Icon,
    Bars3BottomLeftIcon,
    TrophyIcon,
    ArrowTrendingUpIcon, ArrowDownTrayIcon, QuestionMarkCircleIcon, BanknotesIcon, UserPlusIcon,
    ArrowsPointingInIcon as FullScreenIcon, MoonIcon, SunIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from 'next/router';

const Sidebar = ({ token, isOpen, toggleSidebar, mode, onLogout }) => {
    const [windowWidth, setWindowWidth] = useState(null);
    const [user, setUser] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    const router = useRouter();

    // Window Resize Listener for Client Side
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        if (typeof window !== "undefined") {
            // Initialize windowWidth on the client side after the first render
            handleResize();
            window.addEventListener("resize", handleResize);
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", handleResize);
            }
        };
    }, []);

    // Fetch user data from Supabase
    const fetchUserData = async () => {
        if (!token) {
            console.error('Token is missing');
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .select('profile_image, name') // Fetching the name as well
            .eq('id', token)
            .single();

        if (error) {
            console.error('Error fetching user data:', error);
            return;
        }

        setUser(data);
        setProfileImage(data.profile_image);
    };

    useEffect(() => {
        if (token) {
            fetchUserData();
        }
    }, [token]);

    const isActive = (pathname) => {
        const isActiveLink = router.pathname === pathname;
        return isActiveLink
            ? mode === 'dark'
                ? 'bg-[#2a3a48] text-white text-center py-2 px-0'
                : 'bg-[#f7f1eb] text-black text-center py-2 px-0'
            : '';
    };

    // Early return if windowWidth is not available yet
    if (windowWidth === null) {
        return null; // Or some fallback content
    }

    return (
        <div
            className={`fixed left-0 top-0 z-50 bg-opacity-95 h-full transition-all duration-300 ${mode === 'dark' ? 'bg-[#0a0c1d] text-white' : 'bg-white text-black'} sm:w-[50px]`}
            style={{
                width: isOpen ? '256px' : (windowWidth < 640 ? '50px' : '80px'),
            }}
        >
            <div className="flex flex-col h-full">
                <div className={`flex flex-col items-center justify-between ${isOpen ? 'px-4' : 'px-2'} py-10`}>
                    {isOpen ? (
                        <Link href="/">
                            <Image
                                src="/assets/images/logo.svg"
                                alt="Logo"
                                width={300}
                                height={75}
                            />
                        </Link>
                    ) : (
                        <Link href="/">
                            <Image
                                src="/favicon.png"
                                alt="Logo"
                                width={300}
                                height={100}
                            />
                        </Link>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={`flex justify-center ${isOpen ? "-ml-0" : "ml-0"} group relative mt-4`}
                    >
                        {isOpen ? (
                            <>
                                <Bars3Icon
                                    className={`h-6 w-6 ${mode === 'dark' ? 'text-white' : 'text-gray-950'} font-bold`}
                                />
                                <span>Hide Sidebar</span>
                            </>
                        ) : (
                            <>
                                <Bars3BottomLeftIcon
                                    className={`h-6 w-6 ${mode === 'dark' ? 'text-white' : 'text-gray-950'}`}
                                />
                            </>
                        )}
                        <span
                            className="absolute left-full ml-2 mt-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap">
                            {isOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                        </span>
                    </button>
                </div>

                <ul className="flex-grow">
                    {[
                        {href: '/dashboard', icon: HomeIcon, label: 'Dashboard'},
                        {href: '/open-account', icon: HomeIcon, label: 'Open an Account'},
                        {href: '/send-remittances', icon: StarIcon, label: 'Send Remittances'},
                        {href: '/referrals', icon: HomeIcon, label: 'Referrals'},
                        {href: '/download-app', icon: HomeIcon, label: 'Download App'},
                        {href: '/quiz', icon: HomeIcon, label: 'Quiz'},
                        {href: '/leaderboard', icon: TrophyIcon, label: 'Leaderboard'},
                        {href: '/profile', icon: Cog6ToothIcon, label: 'Settings'},
                    ].map(({href, icon: Icon, label}) => (
                        <li key={href} className="py-2">
                            <Link
                                href={href}
                                className={`flex items-center ${isOpen ? 'justify-start px-8' : 'justify-center px-0'} py-2 transition-all duration-500 ease-out transform hover:-translate-y-[10px] hover:shadow-lg hover:py-3 group relative ${isActive(href)}`}
                            >
                                <Icon
                                    className={`h-8 w-8 ${isOpen ? 'mr-2' : ''} p-1 rounded-full ${mode === 'dark' ? 'text-gray-200' : 'text-gray-500'} transition`}/>
                                {isOpen && <span>{label}</span>}
                                {!isOpen && (
                                    <span
                                        className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap">
                                        {label}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div
                    className={`flex items-center justify-between px-4 py-4 mt-auto rounded-2xl ${mode === 'dark' ? 'bg-gray-800' : 'bg-[#e7f8f7]'}`}
                >
                    {/* User Info and Sign out button */}
                    {isOpen ? (
                        <div className="flex items-center justify-between w-full">
                            {/* User Info */}
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
                                    {user?.name}
                                </span>
                            </div>

                            {/* Sign out button */}
                            <button
                                onClick={onLogout}
                                className="flex items-center justify-center text-red-500 hover:text-red-600"
                            >
                                <ArrowRightStartOnRectangleIcon className="h-6 w-6"/>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full relative group cursor-pointer">
                            <Link
                                href="#"
                                onClick={onLogout} // Trigger onLogout when the container is clicked
                                className="px-8 flex items-center justify-center text-red-500 hover:text-red-600"
                            >
                                <ArrowRightStartOnRectangleIcon className="h-6 w-6"/>
                            </Link>
                            <span
                                className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap">
                                Sign Out
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
