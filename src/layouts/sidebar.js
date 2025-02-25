// src/layouts/sidebar.js
import { useEffect, useState } from "react";
import { supabase } from 'lib/supabase';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowRightStartOnRectangleIcon,
    HomeIcon,
    DocumentTextIcon,
    BookOpenIcon,
    EnvelopeIcon,
    UsersIcon,
    Bars3Icon,
    Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';

const Sidebar = ({ token, isOpen, mode, onLogout }) => {
    const { user } = useUser();
    const [windowWidth, setWindowWidth] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    const router = useRouter();

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        if (typeof window !== "undefined") {
            handleResize();
            window.addEventListener("resize", handleResize);
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", handleResize);
            }
        };
    }, []);

    useEffect(() => {
        setProfileImage(user?.profile_image);
    }, [user]);


    const isActive = (pathname) => {
        return router.pathname === pathname ? 'bg-[#8DC63F] text-white' : mode === 'dark' ? 'text-white' : 'text-[#403F41]';
    };

    if (windowWidth === null) return null;

    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Guest';

    return (
        <div
            className={`fixed left-0 top-0 z-50 h-full transition-all duration-300 ${mode === 'dark' ? 'text-white' : 'text-black'} sm:w-[50px]`}
            style={{
                width: isOpen ? '300px' : (windowWidth < 640 ? '50px' : '80px'),
                backgroundColor: 'rgba(40, 168, 224, 0.3)', // #28A8E0 with 30% opacity
            }}
        >
            <div className="flex flex-col h-full">
                <div className={`flex flex-col items-center justify-between ${isOpen ? 'px-4' : 'px-2'} py-10`}>
                    {isOpen ? (
                        <Link href="/">
                            <Image
                                src={mode === 'dark' ? "/assets/images/logo-white.svg" : "/assets/images/logo.svg"}
                                alt="NDSI Logo"
                                width={200}
                                height={75}
                            />
                        </Link>
                    ) : (
                        <Link href="/">
                            <Image
                                src="/favicon.png"
                                alt="NDSI Logo"
                                width={300}
                                height={100}
                            />
                        </Link>
                    )}
                    {/**/}
                </div>

                <ul className="flex-grow">
                    {[
                        { href: '/dashboard', icon: HomeIcon, label: 'NDSI Home' },
                        { href: '/strategic-documents', icon: DocumentTextIcon, label: 'NDSI Strategic Documents' },
                        { href: '/training-materials', icon: BookOpenIcon, label: 'Training Materials' },
                        { href: '/newsletter', icon: EnvelopeIcon, label: 'Newsletter' },
                        { href: '/working-group-docs', icon: UsersIcon, label: 'Working Group Docs' },
                        { href: '/esg-toolkit', icon: HomeIcon, label: 'ESG Toolkit' },
                    ].map(({ href, icon: Icon, label }) => (
                        <li key={href} className="py-2">
                            <Link
                                href={href}
                                className={`flex items-center font-normal ${isOpen ? 'justify-start px-8' : 'justify-center px-0'} py-2 hover:bg-[#28A8E0] hover:text-white hover:-translate-y-[10px] hover:shadow-lg hover:py-3 transition-all duration-300 ease-out group relative ${isActive(href)}`}
                            >
                                <Icon
                                    className={`${isOpen ? 'h-8 w-8 mr-2' : 'h-6 w-6'} rounded-full transition ${router.pathname === href ? 'text-white' : mode === 'dark' ? 'text-white' : 'text-[#403F41]'}`}
                                />
                                {isOpen && <span>{label}</span>}
                                {!isOpen && (
                                    <span
                                        className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap"
                                    >
                                        {label}
                                    </span>
                                )}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div
                    className={`flex items-center justify-between px-4 py-4 mt-auto rounded-2xl ${mode === 'dark' ? 'bg-gray-800' : 'bg-[#a2d2ea]'}`}
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
                            >
                                <ArrowRightStartOnRectangleIcon className={`${isOpen ? 'h-8 w-8' : 'h-6 w-6'}`} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center w-full relative group cursor-pointer">
                            <Link
                                href="#"
                                onClick={onLogout}
                                className="px-8 flex items-center justify-center text-red-500 hover:text-red-600"
                            >
                                <ArrowRightStartOnRectangleIcon className="h-6 w-6" />
                            </Link>
                            <span
                                className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap"
                            >
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