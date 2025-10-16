import Image from "next/image";
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function AdminHeader({ users = [] }) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const logout = () => {
    try {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
    } catch {}
    window.location.href = "/admin/login";
  };
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) setAdminUser(JSON.parse(stored));
    } catch {}
  }, []);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef();
  const userMenuRef = useRef();

  // Calculate new registrations since last login
  const adminLastLogin = adminUser?.last_login_at ? new Date(adminUser.last_login_at) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const newRegistrations = users.filter(user => {
    const userCreatedAt = new Date(user.created_at);
    return userCreatedAt > adminLastLogin;
  }).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    if (showNotifications || showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="relative group">
              <Image
                src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png"
                alt="NDSI Logo"
                width={140}
                height={50}
                className="h-16 w-auto transition-transform group-hover:scale-105"
              />
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </div>
            {/* <div className="ml-6">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                User Approval Management
              </p>
            </div> */}
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a
              href="/admin/dashboard"
              className={`text-md font-semibold transition-colors ${
                router.pathname === "/admin/dashboard"
                  ? "text-ndsi-blue"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              aria-current={router.pathname === "/admin/dashboard" ? "page" : undefined}
            >
              Dashboard
            </a>
            <a
              href="/admin/upload"
              className={`text-md font-semibold transition-colors ${
                router.pathname === "/admin/upload"
                  ? "text-ndsi-blue"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              aria-current={router.pathname === "/admin/upload" ? "page" : undefined}
            >
              Upload Documents
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200"
              >
                <Icon icon="mdi:bell" className="h-5 w-5" />
                {newRegistrations > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {newRegistrations}
                    </span>
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Notifications
                    </h3>
                  </div>

                  <div className="p-4">
                    {newRegistrations > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-ndsi-blue flex items-center justify-center">
                              <Icon
                                icon="mage:user-plus"
                                className="h-4 w-4 text-white"
                              />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ndsi-blue">
                              New User Registrations
                            </p>
                            <p className="text-sm text-ndsi-blue">
                              {newRegistrations} new user registration
                              {newRegistrations !== 1 ? "s" : ""} since your
                              last login
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Icon
                          icon="mdi:bell-off"
                          className="h-12 w-12 text-gray-400 mx-auto mb-3"
                        />
                        <p className="text-gray-500 text-sm">
                          No new notifications
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          You&apos;re all caught up!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-sm text-gray-600 hover:text-gray-800 text-center"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowNotifications(false);
                  setShowUserMenu((v) => !v);
                }}
                className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow transition-all"
              >
                <div className="h-8 w-8 rounded-full bg-ndsi-blue flex items-center justify-center">
                  <Icon icon="mdi:account" className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">
                    {adminUser?.full_name || adminUser?.email}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Administrator</p>
                </div>
                <Icon icon="mdi:chevron-down" className="h-4 w-4 text-slate-500" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={logout}
                  >
                    <Icon icon="mdi:logout" className="h-4 w-4 text-slate-600" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
