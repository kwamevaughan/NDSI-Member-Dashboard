import { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import SimpleModal from "../SimpleModal";

export default function AddAdminModal({ isOpen, onClose, onSubmit, loading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    organization_name: "",
    password: "",
    confirmPassword: "",
    is_super_admin: false,
  });

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        full_name: "",
        email: "",
        organization_name: "",
        password: "",
        confirmPassword: "",
        is_super_admin: false,
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: "",
      email: "",
      organization_name: "",
      password: "",
      confirmPassword: "",
      is_super_admin: false,
    });
    onClose();
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Add New Administrator"
      width="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Icon
              icon="mdi:alert-circle"
              className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important</p>
              <p>
                Administrators have full access to the system. Only add trusted
                users as administrators.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization (Optional)
            </label>
            <input
              type="text"
              value={formData.organization_name}
              onChange={(e) =>
                setFormData({ ...formData, organization_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter organization name"
            />
          </div>

          {/* Password and Confirm Password in the same row */}
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  <Icon
                    icon={showPassword ? "mdi:eye-off" : "mdi:eye"}
                    className="h-5 w-5"
                  />
                </button>
              </div>
            </div>

            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  <Icon
                    icon={showConfirmPassword ? "mdi:eye-off" : "mdi:eye"}
                    className="h-5 w-5"
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_super_admin"
              checked={formData.is_super_admin}
              onChange={(e) =>
                setFormData({ ...formData, is_super_admin: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_super_admin"
              className="ml-2 block text-sm text-gray-700"
            >
              Grant Super Admin privileges
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Icon icon="mdi:plus" className="mr-2 h-4 w-4" />
                Create Admin
              </>
            )}
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}
