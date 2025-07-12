import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { Icon } from '@iconify/react';
import Image from "next/image";
import { GenericTable } from "../../components/GenericTable";
import SimpleModal from "../../components/SimpleModal";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [userToReject, setUserToReject] = useState(null);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'admins'
  const [adminUsers, setAdminUsers] = useState([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [newAdminData, setNewAdminData] = useState({
    full_name: '',
    email: '',
    organization_name: '',
    password: '',
    confirmPassword: '',
    is_super_admin: false
  });
  const [editAdminData, setEditAdminData] = useState({
    full_name: '',
    email: '',
    organization_name: '',
    is_super_admin: false
  });
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [editAdminLoading, setEditAdminLoading] = useState(false);
  const [deleteAdminLoading, setDeleteAdminLoading] = useState(false);
  const [stats, setStats] = useState({
    approvedToday: 0,
    rejectedToday: 0,
    totalPending: 0
  });

  useEffect(() => {
    // Check admin authentication
    const adminToken = localStorage.getItem("admin_token");
    const adminUserData = localStorage.getItem("admin_user");

    if (!adminToken || !adminUserData) {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(adminUserData);
      setAdminUser(user);
      fetchPendingUsers(adminToken);
      fetchAdminUsers(adminToken);
    } catch (error) {
      console.error("Error parsing admin user data:", error);
      router.push("/admin/login");
    }
  }, [router]);

  const fetchPendingUsers = async (token) => {
    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      const userData = data.users || [];
      setUsers(userData);
      calculateStats(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async (token) => {
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

  const handleApproval = async (userId, action, reason = null) => {
    setProcessingUser(userId);
    const adminToken = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
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
      fetchPendingUsers(adminToken);
    } catch (error) {
      console.error("Error processing user:", error);
      toast.error("Failed to process user");
    } finally {
      setProcessingUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  const handleRejectClick = (user) => {
    setUserToReject(user);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = () => {
    if (userToReject) {
      handleApproval(userToReject.id, "reject", rejectionReason);
      setShowRejectionModal(false);
      setUserToReject(null);
      setRejectionReason("");
    }
  };

  const handleRejectCancel = () => {
    setShowRejectionModal(false);
    setUserToReject(null);
    setRejectionReason("");
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setProcessingUser(userToDelete.id);
    const adminToken = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          userId: userToDelete.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      const data = await response.json();
      toast.success(data.message);

      // Refresh the users list and recalculate stats
      fetchPendingUsers(adminToken);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setProcessingUser(null);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return;

    setProcessingUser('bulk');
    const adminToken = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
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
      fetchPendingUsers(adminToken);
    } catch (error) {
      console.error("Error deleting users:", error);
      toast.error("Failed to delete users");
    } finally {
      setProcessingUser(null);
      setShowBulkDeleteModal(false);
      setSelectedUsers([]);
    }
  };

  const handleBulkDeleteClick = () => {
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
    setSelectedUsers([]);
  };

  const handleAddAdmin = async () => {
    // Validation
    if (!newAdminData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!newAdminData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!newAdminData.password) {
      toast.error('Password is required');
      return;
    }
    if (newAdminData.password !== newAdminData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newAdminData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setAddAdminLoading(true);
    const adminToken = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          full_name: newAdminData.full_name.trim(),
          email: newAdminData.email.trim().toLowerCase(),
          organization_name: newAdminData.organization_name.trim(),
          password: newAdminData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create admin");
      }

      const data = await response.json();
      toast.success(data.message);

      // Reset form and close modal
      setNewAdminData({
        full_name: '',
        email: '',
        organization_name: '',
        password: '',
        confirmPassword: ''
      });
      setShowAddAdminModal(false);

      // Refresh admin users list
      fetchAdminUsers(adminToken);
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(error.message);
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleAddAdminCancel = () => {
    setShowAddAdminModal(false);
    setNewAdminData({
      full_name: '',
      email: '',
      organization_name: '',
      password: '',
      confirmPassword: '',
      is_super_admin: false
    });
  };

  const handleEditAdmin = async () => {
    if (!editAdminData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!editAdminData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setEditAdminLoading(true);
    const adminToken = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          adminId: adminToEdit.id,
          full_name: editAdminData.full_name.trim(),
          email: editAdminData.email.trim().toLowerCase(),
          organization_name: editAdminData.organization_name.trim(),
          is_super_admin: editAdminData.is_super_admin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update admin");
      }

      const data = await response.json();
      toast.success(data.message);

      // Reset form and close modal
      setEditAdminData({
        full_name: '',
        email: '',
        organization_name: '',
        is_super_admin: false
      });
      setShowEditAdminModal(false);
      setAdminToEdit(null);

      // Refresh admin users list
      fetchAdminUsers(adminToken);
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error(error.message);
    } finally {
      setEditAdminLoading(false);
    }
  };

  const handleEditAdminCancel = () => {
    setShowEditAdminModal(false);
    setAdminToEdit(null);
    setEditAdminData({
      full_name: '',
      email: '',
      organization_name: '',
      is_super_admin: false
    });
  };

  const handleEditAdminClick = (admin) => {
    setAdminToEdit(admin);
    setEditAdminData({
      full_name: admin.full_name || '',
      email: admin.email || '',
      organization_name: admin.organization_name || '',
      is_super_admin: admin.is_super_admin || false
    });
    setShowEditAdminModal(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    setDeleteAdminLoading(true);
    const adminToken = localStorage.getItem("admin_token");

    try {
      const response = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          adminId: adminToDelete.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete admin");
      }

      const data = await response.json();
      toast.success(data.message);

      // Close modal and reset
      setShowDeleteAdminModal(false);
      setAdminToDelete(null);

      // Refresh admin users list
      fetchAdminUsers(adminToken);
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error(error.message);
    } finally {
      setDeleteAdminLoading(false);
    }
  };

  const handleDeleteAdminClick = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteAdminModal(true);
  };

  const handleDeleteAdminCancel = () => {
    setShowDeleteAdminModal(false);
    setAdminToDelete(null);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-slate-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="relative group">
                <Image
                  src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png"
                  alt="NDSI Logo"
                  width={150}
                  height={60}
                  className="h-12 w-auto transition-transform group-hover:scale-105"
                />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  User Approval Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200">
                <Icon icon="mdi:bell" className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Icon icon="mdi:account" className="h-4 w-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">
                    {adminUser?.full_name || adminUser?.email}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    Administrator
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 group"
              >
                <Icon icon="mdi:logout" className="mr-2 group-hover:rotate-12 transition-transform" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon icon="mdi:account-group" className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Pending Approvals
                  </p>
                  <p className="text-3xl font-medium text-slate-800 mt-1">
                    {stats.totalPending}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div 
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 cursor-pointer"
            onClick={() => setShowApprovedModal(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon icon="mdi:check" className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Approved Today
                  </p>
                  <p className="text-3xl font-medium text-slate-800 mt-1">{stats.approvedToday}</p>
                </div>
                <div className="flex-shrink-0">
                  <Icon icon="mdi:chevron-right" className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div 
            className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 cursor-pointer"
            onClick={() => setShowRejectedModal(true)}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-xl bg-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon icon="mdi:close" className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Rejected Today
                  </p>
                  <p className="text-3xl font-medium text-slate-800 mt-1">{stats.rejectedToday}</p>
                </div>
                <div className="flex-shrink-0">
                  <Icon icon="mdi:chevron-right" className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon icon="mdi:account-group" className="mr-2 h-4 w-4" />
                User Management
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admins'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon icon="mdi:shield-account" className="mr-2 h-4 w-4" />
                Admin Management
              </button>
            </nav>
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Icon icon="mdi:information" className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">User Management</p>
                    <p>This table shows only regular users. Admin accounts are managed separately for security.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <GenericTable
          data={users}
          title="Regular Users"
          emptyMessage="No regular users found."
          onDelete={(user) => handleDeleteClick(user)}
          onBulkDelete={(selectedIds, selectedItems) => {
            setSelectedUsers(selectedItems);
            handleBulkDeleteClick();
          }}
          columns={[
            {
              accessor: "full_name",
              header: "Name",
              sortable: true,
              render: (row) => (
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <Icon icon="mdi:account" className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {row.full_name ||
                        "No name provided"}
                    </div>
                  </div>
                </div>
              ),
            },
            {
              accessor: "email",
              header: "Email",
              sortable: true,
            },
            {
              accessor: "organization_name",
              header: "Organization",
              sortable: true,
              render: (row) => row.organization_name || "—",
            },
            {
              accessor: "created_at",
              header: "Registered",
              sortable: true,
              render: (row) => formatDate(row.created_at),
            },
            {
              accessor: "status",
              header: "Status",
              render: (row) => {
                if (row.approval_status === 'rejected') {
                  return (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Rejected
                    </span>
                  );
                } else if (row.is_approved === true) {
                  return (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Approved
                    </span>
                  );
                } else {
                  return (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Pending
                    </span>
                  );
                }
              },
            },
          ]}
          actions={[
            {
              label: (row) => processingUser === row.id ? "Processing..." : "Approve",
              icon: (row) => processingUser === row.id ? "mdi:loading" : "mdi:check",
              className: "hover:bg-green-100 text-green-600",
              onClick: (row) => {
                if (processingUser !== row.id) {
                  handleApproval(row.id, "approve");
                }
              },
              show: (row) => row.is_approved === false || row.is_approved === null,
            },
            {
              label: (row) => processingUser === row.id ? "Processing..." : "Reject",
              icon: (row) => processingUser === row.id ? "mdi:loading" : "mdi:close",
              className: "hover:bg-red-100 text-red-600",
              onClick: (row) => {
                if (processingUser !== row.id) {
                  handleRejectClick(row);
                }
              },
              show: (row) => row.is_approved === false || row.is_approved === null,
            },
            {
              label: (row) => processingUser === row.id ? "Processing..." : "Delete",
              icon: (row) => processingUser === row.id ? "mdi:loading" : "mdi:delete",
              className: "hover:bg-red-100 text-red-600",
              onClick: (row) => {
                if (processingUser !== row.id) {
                  handleDeleteClick(row);
                }
              },
            },
          ]}
          searchable={true}
          selectable={true}
          enableDateFilter={true}
        />
          </>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <Icon icon="mdi:alert" className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Admin Management</p>
                  <p>
                    {isSuperAdmin 
                      ? "As a Super Administrator, you can create, edit, and delete administrator accounts. Use these privileges with extreme caution."
                      : "Admin accounts have elevated privileges. Only Super Administrators can modify admin accounts."
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Administrator Accounts</h3>
                  <p className="text-sm text-gray-600 mt-1">Current admin users in the system</p>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowAddAdminModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Icon icon="mdi:plus" className="h-4 w-4" />
                    Add New Admin
                  </button>
                )}
              </div>
              <div className="p-6">
                {adminUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon icon="mdi:shield-account" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No admin users found or you don&apos;t have permission to view them.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminUsers.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <Icon icon="mdi:shield-account" className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {admin.full_name || "No name provided"}
                            </p>
                            <p className="text-sm text-gray-600">{admin.email}</p>
                            <p className="text-xs text-gray-500">Admin since {formatDate(admin.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Administrator
                              </span>
                              {admin.is_super_admin && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  Super Admin
                                </span>
                              )}
                            </div>
                            {admin.id === adminUser?.id && (
                              <p className="text-xs text-gray-500">(You)</p>
                            )}
                            {isSuperAdmin && admin.id !== adminUser?.id && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditAdminClick(admin)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                  title="Edit Admin"
                                >
                                  <Icon icon="mdi:pencil" className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdminClick(admin)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Delete Admin"
                                >
                                  <Icon icon="mdi:delete" className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        <SimpleModal
          isOpen={showRejectionModal}
          onClose={handleRejectCancel}
          title="Reject User"
          width="max-w-md"
        >
          <div className="space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to reject{" "}
                <span className="font-semibold text-gray-900">
                  {userToReject?.full_name || 
                   userToReject?.email}
                </span>
                ?
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleRejectCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processingUser === userToReject?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {processingUser === userToReject?.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:close" className="mr-2 h-4 w-4" />
                    Reject User
                  </>
                )}
              </button>
            </div>
          </div>
        </SimpleModal>

        {/* Approved Users Modal */}
        <SimpleModal
          isOpen={showApprovedModal}
          onClose={() => setShowApprovedModal(false)}
          title="Users Approved Today"
          width="max-w-4xl"
        >
          <div className="space-y-4">
            {getApprovedUsers().length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="mdi:check-circle" className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No users have been approved today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getApprovedUsers().map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Icon icon="mdi:account" className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || "No name provided"}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.organization_name && (
                          <p className="text-xs text-gray-500">{user.organization_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Approved
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(user.updated_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SimpleModal>

        {/* Rejected Users Modal */}
        <SimpleModal
          isOpen={showRejectedModal}
          onClose={() => setShowRejectedModal(false)}
          title="Users Rejected Today"
          width="max-w-4xl"
        >
          <div className="space-y-4">
            {getRejectedUsers().length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="mdi:close-circle" className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">No users have been rejected today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getRejectedUsers().map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                        <Icon icon="mdi:account" className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || "No name provided"}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.organization_name && (
                          <p className="text-xs text-gray-500">{user.organization_name}</p>
                        )}
                        {user.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1">
                            <strong>Reason:</strong> {user.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Rejected
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(user.updated_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SimpleModal>

        {/* Bulk Delete Confirmation Modal */}
        <SimpleModal
          isOpen={showBulkDeleteModal}
          onClose={handleBulkDeleteCancel}
          title="Bulk Delete Users"
          width="max-w-md"
        >
          <div className="space-y-6">
            <div className="">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Icon icon="mdi:delete-multiple" className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Delete Multiple Users
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Are you sure you want to permanently delete <span className="font-semibold text-gray-900">{selectedUsers.length}</span> selected user{selectedUsers.length !== 1 ? 's' : ''}?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <Icon icon="mdi:alert-circle" className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">This action cannot be undone.</p>
                    <p className="mt-1">
                      All selected user accounts and associated data will be permanently removed from the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleBulkDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkDelete(selectedUsers.map(user => user.id))}
                disabled={processingUser === 'bulk'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {processingUser === 'bulk' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:delete-multiple" className="mr-2 h-4 w-4" />
                    Delete {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </SimpleModal>

        {/* Delete Confirmation Modal */}
        <SimpleModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          title="Delete User"
          width="max-w-md"
        >
          <div className="space-y-6">
            <div className="">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Icon icon="mdi:delete" className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Delete User Account
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-gray-900">
                  {userToDelete?.full_name || 
                   userToDelete?.email}
                </span>
                ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <Icon icon="mdi:alert-circle" className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">This action cannot be undone.</p>
                    <p className="mt-1">
                      The user&apos;s account and all associated data will be permanently removed from the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={processingUser === userToDelete?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {processingUser === userToDelete?.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:delete" className="mr-2 h-4 w-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </SimpleModal>

        {/* Add Admin Modal */}
        <SimpleModal
          isOpen={showAddAdminModal}
          onClose={handleAddAdminCancel}
          title="Add New Administrator"
          width="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Icon icon="mdi:alert-circle" className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important</p>
                  <p>Administrators have full access to the system. Only add trusted users as administrators.</p>
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
                  value={newAdminData.full_name}
                  onChange={(e) => setNewAdminData({...newAdminData, full_name: e.target.value})}
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
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})}
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
                  value={newAdminData.organization_name}
                  onChange={(e) => setNewAdminData({...newAdminData, organization_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={newAdminData.password}
                  onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password (min 8 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={newAdminData.confirmPassword}
                  onChange={(e) => setNewAdminData({...newAdminData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm password"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_super_admin"
                  checked={newAdminData.is_super_admin}
                  onChange={(e) => setNewAdminData({...newAdminData, is_super_admin: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_super_admin" className="ml-2 block text-sm text-gray-700">
                  Grant Super Admin privileges
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleAddAdminCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={addAdminLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {addAdminLoading ? (
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

        {/* Edit Admin Modal */}
        <SimpleModal
          isOpen={showEditAdminModal}
          onClose={handleEditAdminCancel}
          title="Edit Administrator"
          width="max-w-md"
        >
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Icon icon="mdi:alert-circle" className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Edit Administrator</p>
                  <p>You can modify the administrator&apos;s details and privileges.</p>
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
                  value={editAdminData.full_name}
                  onChange={(e) => setEditAdminData({...editAdminData, full_name: e.target.value})}
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
                  value={editAdminData.email}
                  onChange={(e) => setEditAdminData({...editAdminData, email: e.target.value})}
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
                  value={editAdminData.organization_name}
                  onChange={(e) => setEditAdminData({...editAdminData, organization_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter organization name"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_super_admin"
                  checked={editAdminData.is_super_admin}
                  onChange={(e) => setEditAdminData({...editAdminData, is_super_admin: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_is_super_admin" className="ml-2 block text-sm text-gray-700">
                  Super Admin privileges
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleEditAdminCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAdmin}
                disabled={editAdminLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {editAdminLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:pencil" className="mr-2 h-4 w-4" />
                    Update Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </SimpleModal>

        {/* Delete Admin Modal */}
        <SimpleModal
          isOpen={showDeleteAdminModal}
          onClose={handleDeleteAdminCancel}
          title="Delete Administrator"
          width="max-w-md"
        >
          <div className="space-y-6">
            <div className="">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Icon icon="mdi:delete" className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Delete Administrator Account
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-gray-900">
                  {adminToDelete?.full_name || adminToDelete?.email}
                </span>
                ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <Icon icon="mdi:alert-circle" className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">This action cannot be undone.</p>
                    <p className="mt-1">
                      The administrator&apos;s account and all associated data will be permanently removed from the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleDeleteAdminCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={deleteAdminLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {deleteAdminLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:delete" className="mr-2 h-4 w-4" />
                    Delete Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </SimpleModal>
      </main>
    </div>
  );
}
