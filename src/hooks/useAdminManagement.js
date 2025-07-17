import { useState } from "react";
import { toast } from "react-hot-toast";

export function useAdminManagement(getAdminToken, onRefresh) {
  const [adminUsers, setAdminUsers] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [editAdminLoading, setEditAdminLoading] = useState(false);
  const [deleteAdminLoading, setDeleteAdminLoading] = useState(false);

  const fetchAdminUsers = async (adminUser) => {
    const token = getAdminToken();
    try {
      const response = await fetch("/api/admin/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return; // Don't redirect, just skip admin users
        }
        throw new Error("Failed to fetch admin users");
      }

      const data = await response.json();
      setAdminUsers(data.admins || []);
      
      // Check if current user is super admin
      const currentUser = data.admins?.find(admin => admin.id === adminUser?.id);
      setIsSuperAdmin(currentUser?.is_super_admin || false);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      // Don't show error toast for admin users fetch
    }
  };

  const handleAddAdmin = async (newAdminData) => {
    setAddAdminLoading(true);
    const token = getAdminToken();

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: newAdminData.full_name.trim(),
          email: newAdminData.email.trim().toLowerCase(),
          organization_name: newAdminData.organization_name.trim(),
          password: newAdminData.password,
          is_super_admin: newAdminData.is_super_admin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create admin");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh admin users list
      await fetchAdminUsers();
      return true;
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(error.message);
      return false;
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleEditAdmin = async (adminId, editAdminData) => {
    setEditAdminLoading(true);
    const token = getAdminToken();

    try {
      // Build the request body and include password if present
      const body = {
        adminId,
        full_name: editAdminData.full_name.trim(),
        email: editAdminData.email.trim().toLowerCase(),
        organization_name: editAdminData.organization_name.trim(),
        is_super_admin: editAdminData.is_super_admin,
      };
      if (editAdminData.password && editAdminData.password.length > 0) {
        body.password = editAdminData.password;
      }

      const response = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update admin");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh admin users list
      await fetchAdminUsers();
      return true;
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error(error.message);
      return false;
    } finally {
      setEditAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    setDeleteAdminLoading(true);
    const token = getAdminToken();

    try {
      const response = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete admin");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh admin users list
      await fetchAdminUsers();
      return true;
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error(error.message);
      return false;
    } finally {
      setDeleteAdminLoading(false);
    }
  };

  return {
    adminUsers,
    isSuperAdmin,
    addAdminLoading,
    editAdminLoading,
    deleteAdminLoading,
    fetchAdminUsers,
    handleAddAdmin,
    handleEditAdmin,
    handleDeleteAdmin,
  };
} 