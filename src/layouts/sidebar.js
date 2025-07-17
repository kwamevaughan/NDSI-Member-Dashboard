import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';
import navLinks from '@/data/nav';
import { useTheme } from '@/hooks/useTheme';

const Sidebar = ({ isOpen, onLogout, toggleSidebar }) => {
    const { user } = useUser();
    const [windowWidth, setWindowWidth] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const router = useRouter();
    const sidebarRef = useRef(null);
    const [showLogout, setShowLogout] = useState(false);
    const { mode, toggleMode } = useTheme();

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
          mode === "dark" ? "text-white" : "text-black"
        }`}
        style={{
          width: isOpen ? "250px" : windowWidth < 640 ? "0" : "80px",
          backgroundColor:
            mode === "dark" && windowWidth < 640
              ? "rgba(40, 168, 224, 1)" // Full blue on mobile in dark mode
              : mode === "dark"
              ? "rgba(40, 168, 224, 0.3)" // Translucent blue on desktop in dark mode
              : "white", // White in light mode
        }}
      >
        <div
          className="flex flex-col h-full"
          style={{ backgroundColor: "rgba(40, 168, 224, 0.3)" }}
        >
          {/* Logo and Toggle Section */}
          <div
            className={`flex flex-col items-center py-6 ${
              isOpen ? "px-4" : "px-0"
            }`}
          >
            <div className="flex items-center justify-center w-full gap-6">
              {isOpen ? (
                <>
                  <Image
                    src={
                      mode === "dark"
                        ? "/assets/images/logo-white.svg"
                        : "/assets/images/logo.svg"
                    }
                    alt="NDSI Logo"
                    width={150}
                    height={75}
                  />
                  <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-lg transition-all duration-300 hover:bg-[#28A8E0] hover:text-white ${
                      mode === "dark"
                        ? "text-white hover:bg-[#28A8E0]"
                        : "text-[#403F41] hover:bg-[#28A8E0]"
                    }`}
                    aria-label="Collapse sidebar"
                  >
                    <Icon icon="heroicons:chevron-left" className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={toggleSidebar}
                    className={`p-2 rounded-lg transition-all duration-300 hover:bg-[#28A8E0] hover:text-white ${
                      mode === "dark"
                        ? "text-white hover:bg-[#28A8E0]"
                        : "text-[#403F41] hover:bg-[#28A8E0]"
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
                    isOpen ? "justify-start px-8" : "justify-center px-0"
                  } py-2 hover:bg-[#28A8E0] hover:text-white hover:-translate-y-[10px] hover:shadow-lg transition-all duration-300 group relative ${isActive(
                    href
                  )}`}
                >
                  <Icon
                    icon={icon}
                    className={`${
                      isOpen ? "h-8 w-8 mr-2" : "h-6 w-6"
                    } rounded-full transition ${
                      router.pathname === href
                        ? "text-white"
                        : mode === "dark"
                        ? "text-white group-hover:text-white"
                        : "text-[#403F41] group-hover:text-white"
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
          {!isOpen && windowWidth < 640 ? null : (
            <div
              className={` mt-auto ${
                mode === "dark" ? "bg-ndsi-blue" : "bg-ndsi-blue"
              } shadow-inner`}
            >
              <div
                className="flex items-center p-4 cursor-pointer bg-ndsi-blue "
                onClick={() => setShowLogout((prev) => !prev)}
              >
                <div className={`relative flex items-center ${isOpen ? "gap-2" : "justify-center w-full group"}`}>
                  {isOpen && (
                    <span className="text-sm font-medium text-white">
                      {user.full_name}
                    </span>
                  )}
                  <div className="w-3 h-3 bg-green-400 rounded-full border border-green-400 flex items-center justify-center aspect-square"></div>
                  {!isOpen && (
                    <span className="absolute left-full ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap z-50">
                      {user.full_name}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`transition-all duration-200 px-2 ${
                  showLogout ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex flex-col gap-2 text-white text-sm pt-2">
                  <div
                    className={`relative flex items-center ${isOpen ? "gap-2" : "justify-center w-full group"} cursor-pointer hover:bg-ndsi-green rounded-2xl p-2`}
                    onClick={() => router.push("/profile")}
                  >
                    <Icon icon="mdi:account-outline" className="h-5 w-5" />
                    {isOpen && <span>Profile</span>}
                    {!isOpen && (
                      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap z-50">
                        Profile
                      </span>
                    )}
                  </div>
                  <div
                    className={`relative flex items-center ${isOpen ? "gap-2" : "justify-center w-full group"} py-2 cursor-pointer hover:bg-ndsi-green rounded-2xl p-2`}
                    onClick={() => toggleMode()}
                  >
                    <Icon
                      icon={
                        mode === "dark"
                          ? "line-md:sunny-filled-loop-to-moon-filled-alt-loop-transition"
                          : "line-md:moon-alt-to-sunny-outline-loop-transition"
                      }
                      className={`h-5 w-5 ${
                        mode === "dark"
                          ? "text-paan-blue"
                          : "text-paan-yellow"
                      }`}
                    />
                    {isOpen && (
                      <span>
                        {mode === "dark" ? "Light Mode" : "Dark Mode"}
                      </span>
                    )}
                    {!isOpen && (
                      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap z-50">
                        {mode === "dark" ? "Light Mode" : "Dark Mode"}
                      </span>
                    )}
                  </div>
                  <hr className="border-t border-white" />
                  <div
                    onClick={onLogout}
                    className={`relative flex items-center ${isOpen ? "gap-2" : "justify-center w-full group"} mb-4 text-paan-red hover:text-paan-red transition-colors hover:bg-ndsi-green rounded-2xl p-2 cursor-pointer`}
                  >
                    <Icon icon="mdi:logout" className="h-5 w-5" />
                    {isOpen && <span>Sign Out</span>}
                    {!isOpen && (
                      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 text-xs text-white bg-gray-700 rounded py-1 px-2 opacity-0 group-hover:opacity-75 transition-opacity whitespace-nowrap z-50">
                        Sign Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
};

export default Sidebar;