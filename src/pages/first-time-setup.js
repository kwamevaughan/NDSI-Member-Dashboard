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

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: "" };

    let strength = 0;
    const checks = [
      { regex: /.{8,}/, text: "At least 8 characters" },
      { regex: /[A-Z]/, text: "One uppercase letter" },
      { regex: /[a-z]/, text: "One lowercase letter" },
      { regex: /[0-9]/, text: "One number" },
      { regex: /[^A-Za-z0-9]/, text: "One special character" },
    ];

    checks.forEach((check) => {
      if (check.regex.test(password)) strength++;
    });

    const strengthLevels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = [
      "text-red-500",
      "text-orange-500",
      "text-yellow-500",
      "text-blue-500",
      "text-green-500",
    ];

    return {
      strength,
      text: strengthLevels[strength] || "Very Weak",
      color: strengthColors[strength] || "text-red-500",
      percentage: (strength / 5) * 100,
    };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Validate only missing fields are required
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Only require missing fields
    if (missingFirstName && !first_name) {
      setError("First name is required to complete your profile");
      return;
    }
    if (missingLastName && !last_name) {
      setError("Last name is required to complete your profile");
      return;
    }
    if (!currentPassword) {
      setError("Please enter your current password to verify your identity");
      return;
    }
    if (!newPassword) {
      setError("Please create a new secure password");
      return;
    }
    if (passwordStrength.strength < 3) {
      setError("Please choose a stronger password for better security");
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

      toast.success("Account setup completed successfully!");
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
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6">
            <Image
              src="/assets/images/logo.svg"
              alt="NDSI Logo"
              width={240}
              height={45}
              className="transition-transform hover:scale-105"
            />
          </Link>

          {!success && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-3">
                  Welcome to NDSI! 👋
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Let's secure your account and personalize your experience
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 text-center max-w-lg border border-blue-100">
                <div className="flex items-center justify-center mb-3">
                  <Icon
                    icon="mdi:shield-check"
                    className="text-blue-500 text-2xl mr-2"
                  />
                  <span className="font-semibold text-blue-700 text-lg">
                    Security First
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  To protect your account and provide you with a personalized
                  experience, please update your password and complete your
                  profile information.
                </p>
              </div>
            </>
          )}
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="mb-6">
              <Icon
                icon="mdi:check-circle"
                className="text-green-500 text-6xl mx-auto mb-4"
              />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                All Set! 🎉
              </h2>
              <p className="text-lg text-gray-600">
                Your account has been successfully configured and secured.
              </p>
            </div>
            <button
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-green-600 transform hover:scale-105 transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
              onClick={() => router.replace("/dashboard")}
            >
              <Icon icon="mdi:arrow-right" className="inline mr-2" />
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Password Section */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-700 mb-6 flex items-center gap-3">
                <Icon icon="mdi:lock-reset" className="text-2xl" />
                Update Your Password
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Icon
                      icon="mdi:key"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                    />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={toggleCurrentPasswordVisibility}
                    >
                      <Icon
                        icon={showCurrentPassword ? "mdi:eye-off" : "mdi:eye"}
                        className="text-lg"
                      />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Icon
                      icon="mdi:lock-plus"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                    />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      placeholder="Create secure password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={toggleNewPasswordVisibility}
                    >
                      <Icon
                        icon={showNewPassword ? "mdi:eye-off" : "mdi:eye"}
                        className="text-lg"
                      />
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">
                          Password Strength
                        </span>
                        <span
                          className={`text-xs font-medium ${passwordStrength.color}`}
                        >
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.strength <= 2
                              ? "bg-red-500"
                              : passwordStrength.strength <= 3
                              ? "bg-yellow-500"
                              : passwordStrength.strength <= 4
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${passwordStrength.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <h3 className="text-xl font-semibold text-green-700 mb-6 flex items-center gap-3">
                <Icon icon="mdi:account-edit" className="text-2xl" />
                Complete Your Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name{" "}
                    {missingFirstName && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <Icon
                      icon="mdi:account"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                    />
                    <input
                      type="text"
                      value={first_name}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      placeholder="Enter your first name"
                      required={missingFirstName}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name{" "}
                    {missingLastName && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Icon
                      icon="mdi:account"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                    />
                    <input
                      type="text"
                      value={last_name}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      placeholder="Enter your last name"
                      required={missingLastName}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <div className="relative">
                    <Icon
                      icon="mdi:office-building"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                    />
                    <input
                      type="text"
                      value={organization_name}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      className="w-full pl-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      placeholder="Your organization name"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Icon
                      icon="mdi:briefcase"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                    />
                    <input
                      type="text"
                      value={role_job_title}
                      onChange={(e) => setRoleJobTitle(e.target.value)}
                      className="w-full pl-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      placeholder="Your role or job title"
                    />
                  </div>
                </div>

                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name (Display Name)
                  </label>
                  <div className="relative">
                    <Icon
                      icon="mdi:account-circle"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"
                    />
                    <input
                      type="text"
                      value={full_name}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
                      placeholder="How you'd like to be addressed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <Icon
                  icon="mdi:alert-circle"
                  className="text-red-500 text-xl flex-shrink-0"
                />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-green-600 transform hover:scale-[1.02] transition-all duration-300 text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon icon="mdi:loading" className="animate-spin text-xl" />
                  Setting up your account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Icon icon="mdi:check-circle" className="text-xl" />
                  Complete Setup
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
