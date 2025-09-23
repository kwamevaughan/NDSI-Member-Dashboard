import { useState, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";

const useProfileForm = (user, token, setUser) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    organization_name: user?.organization_name || "",
    role_job_title: user?.role_job_title || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initialData = useMemo(
    () => ({
      full_name: user?.full_name || "",
      organization_name: user?.organization_name || "",
      role_job_title: user?.role_job_title || "",
    }),
    [user]
  );

  const hasChanges = useMemo(
    () =>
      Object.keys(formData).some((key) => formData[key] !== initialData[key]),
    [formData, initialData]
  );

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  }, []);

  const submitProfile = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/updateProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser?.(data.user);
      localStorage.setItem("custom_auth_user", JSON.stringify(data.user));
      toast.success("Profile updated successfully!", {
        icon: "✅",
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
  }, [formData, token, setUser]);

  return {
    formData,
    loading,
    error,
    hasChanges,
    updateField,
    submitProfile,
  };
};

export default useProfileForm;
