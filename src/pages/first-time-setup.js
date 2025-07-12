import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";

export default function FirstTimeSetup() {
  // Get user info from localStorage
  const storedUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("custom_auth_user") || "{}")
      : {};

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [first_name, setFirstName] = useState(storedUser.first_name || "");
  const [last_name, setLastName] = useState(storedUser.last_name || "");
  const [organization_name, setOrganizationName] = useState(
    storedUser.organization_name || ""
  );
  const [role_job_title, setRoleJobTitle] = useState(
    storedUser.role_job_title || ""
  );
  const [full_name, setFullName] = useState(storedUser.full_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Use the same key as UserContext
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("custom_auth_token")
      : null;

  // Determine which fields are missing
  const missingFirstName = !storedUser.first_name;
  const missingLastName = !storedUser.last_name;

  // Validate only missing fields are required
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Only require missing fields
    if (missingFirstName && !first_name) {
      setError("First name is required");
      return;
    }
    if (missingLastName && !last_name) {
      setError("Last name is required");
      return;
    }
    if (!currentPassword) {
      setError("Current password is required");
      return;
    }
    if (!newPassword) {
      setError("New password is required");
      return;
    }
    setLoading(true);
    try {
      // Change password
      const res1 = await fetch("/api/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data1 = await res1.json();
      if (!res1.ok) throw new Error(data1.error || "Failed to change password");

      // Update profile
      const res2 = await fetch("/api/updateProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name,
          last_name,
          organization_name,
          role_job_title,
          full_name,
        }),
      });
      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error || "Failed to update profile");

      // Update user in localStorage so UserContext is in sync
      localStorage.setItem("custom_auth_user", JSON.stringify(data2.user));

      toast.success("Setup complete!");
      setSuccess(true);
      // Do not redirect automatically
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ececec] to-[#d9f2e6] py-8 px-2">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-[#e0e0e0]">
        <div className="flex flex-col items-center mb-6">
          <Link href="/">
            <Image
              src="/assets/images/logo.svg"
              alt="NDSI Logo"
              width={120}
              height={40}
              className="mb-2"
            />
          </Link>
          {!success && (
            <>
              <h2 className="text-3xl font-bold text-[#28A8E0] mb-1 text-center">
                First Time Setup
              </h2>
              <p className="text-gray-600 text-center mb-2">
                Welcome! Please update your password and personal information to
                continue.
              </p>
              <div className="bg-[#f7f7f7] rounded-lg px-4 py-2 text-sm text-gray-700 mb-2 text-center max-w-md">
                <span className="font-semibold text-[#28A8E0]">Why?</span> For your
                security and to personalize your experience, we require you to set a
                new password and complete your profile.
              </div>
            </>
          )}
        </div>
        {success ? (
          <div className="flex flex-col items-center justify-center py-">
            <div className="text-[#28A8E0] text-2xl font-bold mb-2">
              Setup Complete!
            </div>
            <div className="text-gray-700 mb-6 text-center">
              Your password and profile have been updated successfully.
            </div>
            <button
              className="px-6 py-3 bg-[#28A8E0] text-white font-bold rounded-lg hover:bg-[#8DC63F] transition-all duration-300 text-lg shadow-md"
              onClick={() => router.replace("/dashboard")}
            >
              Proceed to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Password Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#28A8E0] mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:lock-outline"
                  className="inline-block h-5 w-5"
                />{" "}
                Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Icon
                    icon="mdi:key-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] transition-all"
                    placeholder="Current Password"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    onClick={toggleCurrentPasswordVisibility}
                  >
                    {showCurrentPassword ? (
                      <Icon
                        icon="mdi:eye-off-outline"
                        className="text-gray-400 h-5 w-5"
                      />
                    ) : (
                      <Icon
                        icon="mdi:eye-outline"
                        className="text-gray-400 h-5 w-5"
                      />
                    )}
                  </span>
                </div>
                <div className="relative">
                  <Icon
                    icon="mdi:lock-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] transition-all"
                    placeholder="New Password"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    onClick={toggleNewPasswordVisibility}
                  >
                    {showNewPassword ? (
                      <Icon
                        icon="mdi:eye-off-outline"
                        className="text-gray-400 h-5 w-5"
                      />
                    ) : (
                      <Icon
                        icon="mdi:eye-outline"
                        className="text-gray-400 h-5 w-5"
                      />
                    )}
                  </span>
                </div>
              </div>
            </div>
            {/* Profile Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#28A8E0] mb-4 flex items-center gap-2">
                <Icon
                  icon="mdi:account-circle-outline"
                  className="inline-block h-5 w-5"
                />{" "}
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Icon
                    icon="mdi:account-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  />
                  <input
                    type="text"
                    value={first_name}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-10 p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] transition-all"
                    placeholder="First Name"
                    required={missingFirstName}
                  />
                </div>
                <div className="relative">
                  <Icon
                    icon="mdi:account-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  />
                  <input
                    type="text"
                    value={last_name}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-10 p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] transition-all"
                    placeholder="Last Name"
                    required={missingLastName}
                  />
                </div>
                <div className="relative">
                  <Icon
                    icon="mdi:office-building-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  />
                  <input
                    type="text"
                    value={organization_name}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="w-full pl-10 p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] transition-all"
                    placeholder="Organization Name"
                  />
                </div>
                <div className="relative">
                  <Icon
                    icon="mdi:briefcase-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  />
                  <input
                    type="text"
                    value={role_job_title}
                    onChange={(e) => setRoleJobTitle(e.target.value)}
                    className="w-full pl-10 p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] transition-all"
                    placeholder="Role / Job Title"
                  />
                </div>
                <div className="relative md:col-span-2">
                  <Icon
                    icon="mdi:account-circle-outline"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"
                  />
                  <input
                    type="text"
                    value={full_name}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] transition-all"
                    placeholder="Full Name"
                  />
                </div>
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-[#28A8E0] text-white font-bold rounded-lg hover:bg-[#8DC63F] transition-all duration-300 text-lg shadow-md disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit & Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
