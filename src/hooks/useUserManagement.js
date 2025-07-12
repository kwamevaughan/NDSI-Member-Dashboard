import { useState } from "react";
import { toast } from "react-hot-toast";

export function useUserManagement(getAdminToken) {
  const [users, setUsers] = useState([]);
  const [processingUser, setProcessingUser] = useState(null);
  const [stats, setStats] = useState({
    approvedToday: 0,
    rejectedToday: 0,
    totalPending: 0
  });

  const fetchPendingUsers = async () => {
    const token = getAdminToken();
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed");
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const userData = data.users || [];
      setUsers(userData);
      calculateStats(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.message === "Authentication failed") {
        throw error; // Let parent handle auth failure
      }
      toast.error("Failed to load pending users");
    }
  };

  const handleApproval = async (userId, action, reason = null) => {
    setProcessingUser(userId);
    const token = getAdminToken();

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          action,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process user");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh the users list and recalculate stats
      await fetchPendingUsers();
    } catch (error) {
      console.error("Error processing user:", error);
      toast.error("Failed to process user");
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setProcessingUser(userId);
    const token = getAdminToken();

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh the users list and recalculate stats
      await fetchPendingUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return;

    setProcessingUser('bulk');
    const token = getAdminToken();

    try {
      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userIds: selectedIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete users");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh the users list and recalculate stats
      await fetchPendingUsers();
    } catch (error) {
      console.error("Error deleting users:", error);
      toast.error(error.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const calculateStats = (userData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedToday = userData.filter(user => {
      if (!user.updated_at || !user.is_approved) return false;
      const updatedDate = new Date(user.updated_at);
      updatedDate.setHours(0, 0, 0, 0);
      return updatedDate.getTime() === today.getTime() && user.is_approved === true;
    }).length;

    const rejectedToday = userData.filter(user => {
      if (!user.updated_at || user.approval_status !== 'rejected') return false;
      const updatedDate = new Date(user.updated_at);
      updatedDate.setHours(0, 0, 0, 0);
      return updatedDate.getTime() === today.getTime();
    }).length;

    const totalPending = userData.filter(user => 
      user.is_approved === false || user.is_approved === null
    ).length;

    setStats({
      approvedToday,
      rejectedToday,
      totalPending
    });
  };

  const getApprovedUsers = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return users.filter(user => {
      if (!user.updated_at || !user.is_approved) return false;
      const updatedDate = new Date(user.updated_at);
      updatedDate.setHours(0, 0, 0, 0);
      return updatedDate.getTime() === today.getTime() && user.is_approved === true;
    });
  };

  const getRejectedUsers = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return users.filter(user => {
      if (!user.updated_at || user.approval_status !== 'rejected') return false;
      const updatedDate = new Date(user.updated_at);
      updatedDate.setHours(0, 0, 0, 0);
      return updatedDate.getTime() === today.getTime();
    });
  };

  return {
    users,
    stats,
    processingUser,
    fetchPendingUsers,
    handleApproval,
    handleDeleteUser,
    handleBulkDelete,
    getApprovedUsers,
    getRejectedUsers,
  };
} 