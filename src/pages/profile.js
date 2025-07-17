import { useState } from "react";
import { useRouter } from "next/router";
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import useSidebar from "@/hooks/useSidebar";
import { useUser } from "@/context/UserContext";
import useSignOut from "@/hooks/useSignOut";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { useTheme } from '@/hooks/useTheme';
// Date formatting helper
function formatDateHuman(dateString) {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return dateString;
  }
}

const ProfilePage = () => {
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { handleSignOut } = useSignOut();
  const { user, token, setUser } = useUser();

  const [activeSection, setActiveSection] = useState("profile");

  // Profile state
  const [organization_name, setOrganizationName] = useState(
    user?.organization_name || ""
  );
  const [role_job_title, setRoleJobTitle] = useState(
    user?.role_job_title || ""
  );
  const [full_name, setFullName] = useState(user?.full_name || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);


  // Update profile handler
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const res = await fetch("/api/updateProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          organization_name,
          role_job_title,
          full_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setProfileSuccess(true);
      setUser && setUser(data.user);
      localStorage.setItem("custom_auth_user", JSON.stringify(data.user));
      toast.success("Profile updated successfully!");
    } catch (err) {
      setProfileError(err.message);
      toast.error(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Change password handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed successfully!");
    } catch (err) {
      setPasswordError(err.message);
      toast.error(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Save button handler (context-aware)
  const handleSave = (e) => {
    if (activeSection === "profile") {
      handleProfileSubmit(e);
    } else if (activeSection === "password") {
      handlePasswordSubmit(e);
    }
  };

  // Track initial values for profile
  const initialProfile = {
    full_name: user?.full_name || "",
    organization_name: user?.organization_name || "",
    role_job_title: user?.role_job_title || "",
  };

  // Detect unsaved changes for profile
  const profileChanged =
    full_name !== initialProfile.full_name ||
    organization_name !== initialProfile.organization_name ||
    role_job_title !== initialProfile.role_job_title;

  // Detect if password fields are filled
  const passwordReady = currentPassword.length > 0 && newPassword.length > 0;

  // Save button enabled state
  const canSave =
    (activeSection === "profile" && profileChanged && !profileLoading) ||
    (activeSection === "password" && passwordReady && !passwordLoading);

  const renderProfileSection = () => (
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg md:text-2xl font-semibold text-[#28A8E0] mb-4">
          Edit Profile
        </h1>

        
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Manage your account information
      </span>

      <div className="grid grid-cols-1 gap-8">
        <div
          className={`lg:col-span-2 p-6 rounded-xl ${
            mode === "dark" ? "bg-slate-800" : "bg-white"
          } border ${mode === "dark" ? "border-slate-700" : "border-gray-200"}`}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    mode === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Full Name
                </label>
                <div className="relative">
                  <Icon
                    icon="mdi:account"
                    className="absolute left-3 text-gray-400 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    value={full_name}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                      mode === "dark"
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-gray-50 text-gray-900 border-gray-200"
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-2 ${
                    mode === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Icon
                    icon="mdi:email"
                    className="absolute left-3 text-gray-400 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="email"
                    value={user?.email || ""}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                      mode === "dark"
                        ? "bg-slate-700/30 text-gray-400 border-slate-600/30"
                        : "bg-gray-100/50 text-gray-500 border-gray-200/50"
                    } border cursor-not-allowed`}
                    placeholder="Your email address"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    mode === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Organization
                </label>
                <div className="relative">
                  <Icon
                    icon="mdi:building"
                    className="absolute left-3 text-gray-400 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    value={organization_name}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                      mode === "dark"
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-gray-50 text-gray-900 border-gray-200"
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Your organization"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    mode === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Job Title
                </label>
                <div className="relative">
                  <Icon
                    icon="mdi:briefcase"
                    className="absolute left-3 text-gray-400 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    value={role_job_title}
                    onChange={(e) => setRoleJobTitle(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                      mode === "dark"
                        ? "bg-slate-700 text-white border-slate-600"
                        : "bg-gray-50 text-gray-900 border-gray-200"
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Your job title"
                  />
                </div>
              </div>
            </div>

            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Profile updated successfully!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPasswordSection = () => (
    <div className="space-y-8">
      <h1 className="text-lg md:text-2xl font-semibold text-[#28A8E0] mb-4">
        Change Password
      </h1>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Manage your account security
      </span>

      <div
        className={`p-6 rounded-xl ${
          mode === "dark" ? "bg-slate-800" : "bg-white"
        } border ${mode === "dark" ? "border-slate-700" : "border-gray-200"}`}
      >
        <div className="space-y-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  mode === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Current Password
              </label>
              <div className="relative">
                <Icon
                  icon="mdi:key"
                  className="absolute left-3 text-gray-400 top-1/2 -translate-y-1/2"
                />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                    mode === "dark"
                      ? "bg-slate-700 text-white border-slate-600"
                      : "bg-gray-50 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  mode === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                New Password
              </label>
              <div className="relative">
                <Icon
                  icon="mdi:lock"
                  className="absolute left-3 text-gray-400 top-1/2 -translate-y-1/2"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                    mode === "dark"
                      ? "bg-slate-700 text-white border-slate-600"
                      : "bg-gray-50 text-gray-900 border-gray-200"
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Password changed successfully!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );


  return (
    <div
      className={`flex flex-col h-screen ${
        mode === "dark" ? "bg-[#1a1a1a]" : "bg-[#f7f1eb]"
      }`}
    >
      <Header
        isSidebarOpen={isSidebarOpen}
        mode={mode}
        toggleMode={toggleMode}
        onLogout={handleSignOut}
      />
      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          mode={mode}
          onLogout={handleSignOut}
          toggleMode={toggleMode}
        />
        <main
          className={`flex flex-1 transition-all duration-300 ease-in-out mt-20 ${
            isSidebarOpen ? "lg:ml-[250px]" : "ml-0 lg:ml-[80px]"
          }`}
        >
          {/* Main Content */}
          <div
            className={`flex-1 ${
              mode === "dark"
                ? "bg-[#0a0c1d] text-white"
                : "bg-[#ececec] text-black"
            }`}
          >
            <main className="p-8">
              <div className="mb-8">
                <nav className="flex border-b border-gray-200 dark:border-slate-700">
                  <button
                    className={`px-6 py-3 -mb-px text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none ${mode === "dark" ? "bg-transparent" : "bg-white/50"} ${
                      activeSection === "profile"
                        ? "border-ndsi-blue text-ndsi-blue dark:text-ndsi-blue dark:border-ndsi-blue bg-transparent dark:bg-slate-800"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-ndsi-blue hover:border-ndsi-blue"
                    }`}
                    onClick={() => setActiveSection("profile")}
                    type="button"
                  >
                    Edit Profile
                  </button>
                  <button
                    className={`px-6 py-3 -mb-px text-sm font-medium border-b-2 transition-colors duration-200 focus:outline-none ${mode === "dark" ? "bg-transparent" : "bg-white/50"} ${
                      activeSection === "password"
                        ? "border-ndsi-blue text-ndsi-blue dark:text-ndsi-blue dark:border-ndsi-blue bg-transparent dark:bg-slate-800"
                        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-ndsi-blue hover:border-ndsi-blue"
                    }`}
                    onClick={() => setActiveSection("password")}
                    type="button"
                  >
                    Change Password
                  </button>
                </nav>
              </div>
              {activeSection === "profile"
                ? renderProfileSection()
                : renderPasswordSection()}

              <div className="flex justify-between mt-10">
                <div className="flex items-center gap-2">
                  <Icon icon="fluent:check-20-regular" className="w-5 h-5" />
                  <p className={`text-sm ${mode === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Last saved: <span className={`font-semibold ${mode === "dark" ? "text-gray-300" : "text-gray-700"}`}>{formatDateHuman(user?.updated_at)}</span>
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className="px-6 py-2 bg-ndsi-blue text-white rounded-lg hover:bg-ndsi-blue/80 disabled:opacity-50 flex items-center gap-2"
                >
                  <Icon icon="heroicons:server" className="w-5 h-5" />
                  {activeSection === "profile"
                    ? profileLoading
                      ? "Saving..."
                      : "Save"
                    : passwordLoading
                      ? "Saving..."
                      : "Save"
                  }
                </button>
              </div>
            </main>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
