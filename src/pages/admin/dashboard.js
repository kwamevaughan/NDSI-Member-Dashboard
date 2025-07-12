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
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load pending users");
    } finally {
      setLoading(false);
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

      // Refresh the users list
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
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {users.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
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
                  <p className="text-3xl font-bold text-slate-800 mt-1">0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50">
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
                  <p className="text-3xl font-bold text-slate-800 mt-1">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Management Card */}
        <GenericTable
          data={users}
          title="Pending User Approvals"
          emptyMessage="No pending approvals. All user registrations have been processed."
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
                        `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
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
                if (row.is_approved === true) {
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
            },
          ]}
          searchable={true}
          selectable={false}
          enableDateFilter={true}
        />

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
                   `${userToReject?.first_name || ""} ${userToReject?.last_name || ""}`.trim() ||
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
      </main>
    </div>
  );
}
