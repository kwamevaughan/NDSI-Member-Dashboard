import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import useSidebar from "@/hooks/useSidebar";
import { useUser } from "@/context/UserContext";
import useSignOut from "@/hooks/useSignOut";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { useTheme } from "@/hooks/useTheme";
import useProfileForm from "@/hooks/useProfileForm";

// Utility functions
const formatDateHuman = (dateString) => {
  if (!dateString) return "Never";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return dateString;
  }
};

const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    },
  };
};


const usePasswordForm = (token) => {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const passwordValidation = useMemo(
    () => validatePassword(passwords.new),
    [passwords.new]
  );

  const passwordsMatch = useMemo(
    () => passwords.new === passwords.confirm && passwords.confirm.length > 0,
    [passwords.new, passwords.confirm]
  );

  const canSubmit = useMemo(
    () =>
      passwords.current.length > 0 &&
      passwordValidation.isValid &&
      passwordsMatch,
    [passwords, passwordValidation.isValid, passwordsMatch]
  );

  const updatePassword = useCallback((field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const submitPassword = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setPasswords({ current: "", new: "", confirm: "" });
      toast.success("Password changed successfully!", {
        icon: "🔒",
        duration: 3000,
      });

      return { success: true };
    } catch (err) {
      const errorMessage = err.message;
      setError(errorMessage);
      toast.error(errorMessage, {
        icon: "❌",
        duration: 4000,
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [passwords, token]);

  return {
    passwords,
    loading,
    error,
    showPasswords,
    passwordValidation,
    passwordsMatch,
    canSubmit,
    updatePassword,
    togglePasswordVisibility,
    submitPassword,
  };
};

// Components
const InputField = ({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  mode,
  showPassword,
  onTogglePassword,
}) => (
  <div>
    <label
      className={`block text-sm font-medium mb-2 ${
        mode === "dark" ? "text-gray-300" : "text-gray-700"
      }`}
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      <Icon
        icon={icon}
        className="absolute left-3 text-gray-400 top-1/2 -translate-y-1/2 z-10"
      />
      <input
        type={type === "password" && showPassword ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-10 ${
          type === "password" ? "pr-12" : "pr-4"
        } py-3 rounded-lg transition-all duration-200 ${
          disabled
            ? mode === "dark"
              ? "bg-slate-700/30 text-gray-400 border-slate-600/30 cursor-not-allowed"
              : "bg-gray-100/50 text-gray-500 border-gray-200/50 cursor-not-allowed"
            : mode === "dark"
            ? "bg-slate-700 text-white border-slate-600 focus:bg-slate-600"
            : "bg-gray-50 text-gray-900 border-gray-200 focus:bg-white"
        } border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
      {type === "password" && onTogglePassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <Icon icon={showPassword ? "mdi:eye-off" : "mdi:eye"} />
        </button>
      )}
    </div>
  </div>
);

const PasswordStrengthIndicator = ({ validation, mode }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`mt-2 p-3 rounded-lg ${
      mode === "dark" ? "bg-slate-700/50" : "bg-gray-50"
    }`}
  >
    <div className="space-y-1">
      {Object.entries({
        minLength: "At least 8 characters",
        hasUpperCase: "One uppercase letter",
        hasLowerCase: "One lowercase letter",
        hasNumbers: "One number",
        hasSpecialChar: "One special character",
      }).map(([key, label]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <Icon
            icon={
              validation.requirements[key]
                ? "mdi:check-circle"
                : "mdi:circle-outline"
            }
            className={`w-3 h-3 ${
              validation.requirements[key] ? "text-green-500" : "text-gray-400"
            }`}
          />
          <span
            className={
              validation.requirements[key]
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500"
            }
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

const SaveButton = ({
  onClick,
  disabled,
  loading,
  children,
  icon = "heroicons:server",
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 ${
      disabled
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
    }`}
  >
    <Icon
      icon={loading ? "eos-icons:loading" : icon}
      className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
    />
    {children}
  </motion.button>
);

const TabButton = ({ active, onClick, children, mode }) => (
  <motion.button
    whileHover={{ y: -1 }}
    whileTap={{ y: 0 }}
    className={`px-6 py-3 -mb-px text-sm font-medium border-b-2 transition-all duration-200 focus:outline-none relative overflow-hidden ${
      active
        ? "border-ndsi-blue text-ndsi-blue dark:text-blue-400 dark:border-blue-400"
        : "border-transparent text-gray-500 dark:text-gray-400 hover:text-ndsi-blue hover:border-ndsi-blue"
    } ${mode === "dark" ? "bg-transparent" : "bg-white/50"}`}
    onClick={onClick}
    type="button"
  >
    {children}
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-0 bg-ndsi-blue/20 dark:bg-ndsi-blue/20 -z-10"
        initial={false}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </motion.button>
);

const ProfilePage = () => {
  const { mode, toggleMode } = useTheme();
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { handleSignOut } = useSignOut();
  const { user, token, setUser } = useUser();

  const [activeSection, setActiveSection] = useState("profile");

  const profileForm = useProfileForm(user, token, setUser);
  const passwordForm = usePasswordForm(token);

  const handleSave = useCallback(async () => {
    if (activeSection === "profile" && profileForm.hasChanges) {
      await profileForm.submitProfile();
    } else if (activeSection === "password" && passwordForm.canSubmit) {
      await passwordForm.submitPassword();
    }
  }, [activeSection, profileForm, passwordForm]);

  const canSave = useMemo(() => {
    if (activeSection === "profile") {
      return profileForm.hasChanges && !profileForm.loading;
    } else if (activeSection === "password") {
      return passwordForm.canSubmit && !passwordForm.loading;
    }
    return false;
  }, [activeSection, profileForm, passwordForm]);

  const renderProfileSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-semibold text-ndsi-blue dark:text-blue-400 mb-2">
            Edit Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your account information
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-xl border backdrop-blur-sm ${
          mode === "dark"
            ? "bg-slate-800/80 border-slate-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField
                label="Full Name"
                icon="mdi:account"
                value={profileForm.formData.full_name}
                onChange={(value) =>
                  profileForm.updateField("full_name", value)
                }
                placeholder="Enter your full name"
                required
                mode={mode}
              />
            </div>

            <div className="md:col-span-2">
              <InputField
                label="Email Address"
                icon="mdi:email"
                type="email"
                value={user?.email || ""}
                onChange={() => {}}
                placeholder="Your email address"
                disabled
                mode={mode}
              />
            </div>

            <InputField
              label="Organization"
              icon="mdi:building"
              value={profileForm.formData.organization_name}
              onChange={(value) =>
                profileForm.updateField("organization_name", value)
              }
              placeholder="Your organization"
              mode={mode}
            />

            <InputField
              label="Job Title"
              icon="mdi:briefcase"
              value={profileForm.formData.role_job_title}
              onChange={(value) =>
                profileForm.updateField("role_job_title", value)
              }
              placeholder="Your job title"
              mode={mode}
            />
          </div>

          <AnimatePresence>
            {profileForm.error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              >
                <Icon icon="mdi:alert-circle" className="w-5 h-5" />
                {profileForm.error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderPasswordSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-lg md:text-2xl font-semibold text-ndsi-blue dark:text-blue-400 mb-2">
          Change Password
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account security
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-xl border backdrop-blur-sm ${
          mode === "dark"
            ? "bg-slate-800/80 border-slate-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="space-y-6">
          <InputField
            label="Current Password"
            icon="mdi:key"
            type="password"
            value={passwordForm.passwords.current}
            onChange={(value) => passwordForm.updatePassword("current", value)}
            placeholder="Enter current password"
            required
            mode={mode}
            showPassword={passwordForm.showPasswords.current}
            onTogglePassword={() =>
              passwordForm.togglePasswordVisibility("current")
            }
          />

          <InputField
            label="New Password"
            icon="mdi:lock"
            type="password"
            value={passwordForm.passwords.new}
            onChange={(value) => passwordForm.updatePassword("new", value)}
            placeholder="Enter new password"
            required
            mode={mode}
            showPassword={passwordForm.showPasswords.new}
            onTogglePassword={() =>
              passwordForm.togglePasswordVisibility("new")
            }
          />

          <AnimatePresence>
            {passwordForm.passwords.new.length > 0 && (
              <PasswordStrengthIndicator
                validation={passwordForm.passwordValidation}
                mode={mode}
              />
            )}
          </AnimatePresence>

          <InputField
            label="Confirm New Password"
            icon="mdi:lock-check"
            type="password"
            value={passwordForm.passwords.confirm}
            onChange={(value) => passwordForm.updatePassword("confirm", value)}
            placeholder="Confirm new password"
            required
            mode={mode}
            showPassword={passwordForm.showPasswords.confirm}
            onTogglePassword={() =>
              passwordForm.togglePasswordVisibility("confirm")
            }
          />

          <AnimatePresence>
            {passwordForm.passwords.confirm.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-xs flex items-center gap-2 ${
                  passwordForm.passwordsMatch
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                <Icon
                  icon={
                    passwordForm.passwordsMatch
                      ? "mdi:check-circle"
                      : "mdi:alert-circle"
                  }
                  className="w-4 h-4"
                />
                {passwordForm.passwordsMatch
                  ? "Passwords match"
                  : "Passwords don't match"}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {passwordForm.error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              >
                <Icon icon="mdi:alert-circle" className="w-5 h-5" />
                {passwordForm.error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
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
          <div
            className={`flex-1 ${
              mode === "dark"
                ? "bg-gradient-to-br from-[#0a0c1d] via-[#0f1129] to-[#1a1a2e] text-white"
                : "bg-gradient-to-br from-[#ececec] via-[#f5f5f5] to-[#e8e8e8] text-black"
            }`}
          >
            <main className="p-8">
              {/* Tab Navigation */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <nav className="flex border-b border-gray-200 dark:border-slate-700">
                  <TabButton
                    active={activeSection === "profile"}
                    onClick={() => setActiveSection("profile")}
                    mode={mode}
                  >
                    <Icon
                      icon="mdi:account-edit"
                      className="w-4 h-4 mr-2 inline"
                    />
                    Edit Profile
                  </TabButton>
                  <TabButton
                    active={activeSection === "password"}
                    onClick={() => setActiveSection("password")}
                    mode={mode}
                  >
                    <Icon icon="mdi:lock" className="w-4 h-4 mr-2 inline" />
                    Change Password
                  </TabButton>
                </nav>
              </motion.div>

              {/* Content */}
              <AnimatePresence mode="wait">
                {activeSection === "profile"
                  ? renderProfileSection()
                  : renderPasswordSection()}
              </AnimatePresence>

              {/* Footer Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      mode === "dark" ? "bg-slate-700" : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      icon="fluent:checkmark-20-regular"
                      className="w-4 h-4 text-green-500"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateHuman(user?.updated_at)}
                    </p>
                  </div>
                </div>

                <SaveButton
                  onClick={handleSave}
                  disabled={!canSave}
                  loading={profileForm.loading || passwordForm.loading}
                  icon={
                    activeSection === "profile"
                      ? "mdi:account-check"
                      : "mdi:lock-check"
                  }
                >
                  {profileForm.loading || passwordForm.loading
                    ? "Saving..."
                    : "Save Changes"}
                </SaveButton>
              </motion.div>
            </main>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
