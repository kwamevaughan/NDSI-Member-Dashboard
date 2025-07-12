import { useState, useEffect } from "react";
import { Icon } from '@iconify/react';
import Image from "next/image";
import { GenericTable } from "../../components/GenericTable";
import SimpleModal from "../../components/SimpleModal";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { useUserManagement } from "../../hooks/useUserManagement";
import { useAdminManagement } from "../../hooks/useAdminManagement";
import { formatDate } from "../../utils/dateUtils";
import StatsCards from "../../components/admin/StatsCards";
import AddAdminModal from "../../components/admin/AddAdminModal";

import AdminHeader from "../../layouts/adminHeader";

export default function AdminDashboard() {
  const { adminUser, loading: authLoading, logout, getAdminToken } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  // Modal states
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [userToReject, setUserToReject] = useState(null);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [editAdminData, setEditAdminData] = useState({
    full_name: '',
    email: '',
    organization_name: '',
    is_super_admin: false
  });

  // Initialize hooks
  const userManagement = useUserManagement(getAdminToken);
  const adminManagement = useAdminManagement(getAdminToken);

  useEffect(() => {
    if (adminUser && !authLoading) {
      userManagement.fetchPendingUsers();
      adminManagement.fetchAdminUsers(adminUser);
    }
  }, [adminUser, authLoading]);

  // User management handlers
  const handleRejectClick = (user) => {
    setUserToReject(user);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleRejectConfirm = () => {
    if (userToReject) {
      userManagement.handleApproval(userToReject.id, "reject", rejectionReason);
      setShowRejectionModal(false);
      setUserToReject(null);
      setRejectionReason("");
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      await userManagement.handleDeleteUser(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    await userManagement.handleBulkDelete(selectedIds);
    setShowBulkDeleteModal(false);
    setSelectedUsers([]);
  };

  const handleBulkDeleteClick = () => {
    setShowBulkDeleteModal(true);
  };

  // Admin management handlers
  const handleAddAdmin = async (newAdminData) => {
    return await adminManagement.handleAddAdmin(newAdminData);
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

  const handleEditAdmin = async () => {
    if (adminToEdit) {
      const success = await adminManagement.handleEditAdmin(adminToEdit.id, editAdminData);
      if (success) {
        setShowEditAdminModal(false);
        setAdminToEdit(null);
      }
    }
  };

  const handleDeleteAdminClick = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteAdminModal(true);
  };

  const handleDeleteAdmin = async () => {
    if (adminToDelete) {
      const success = await adminManagement.handleDeleteAdmin(adminToDelete.id);
      if (success) {
        setShowDeleteAdminModal(false);
        setAdminToDelete(null);
      }
    }
  };

  if (authLoading) {
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
              <AdminHeader users={userManagement.users} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <StatsCards 
          stats={userManagement.stats}
          onApprovedClick={() => setShowApprovedModal(true)}
          onRejectedClick={() => setShowRejectedModal(true)}
              />

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex py-2 px-1 border-b-2 font-medium text-sm ${
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
                className={`flex py-2 px-1 border-b-2 font-medium text-sm ${
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
              data={userManagement.users}
              title="Regular Users"
              emptyMessage="No regular users found."
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
                        <div className="h-10 w-10 rounded-full bg-ndsi-blue flex items-center justify-center">
                          <Icon icon="mdi:account" className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {row.full_name || "No name provided"}
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
                  label: (row) => userManagement.processingUser === row.id ? "Processing..." : "Approve",
                  icon: (row) => userManagement.processingUser === row.id ? "mdi:loading" : "mdi:check",
                  className: "hover:bg-green-100 text-green-600",
                  onClick: (row) => {
                    if (userManagement.processingUser !== row.id) {
                      userManagement.handleApproval(row.id, "approve");
                    }
                  },
                  show: (row) => row.is_approved === false || row.is_approved === null,
                },
                {
                  label: (row) => userManagement.processingUser === row.id ? "Processing..." : "Reject",
                  icon: (row) => userManagement.processingUser === row.id ? "mdi:loading" : "mdi:close",
                  className: "hover:bg-red-100 text-red-600",
                  onClick: (row) => {
                    if (userManagement.processingUser !== row.id) {
                      handleRejectClick(row);
                    }
                  },
                  show: (row) => row.is_approved === false || row.is_approved === null,
                },
                {
                  label: (row) => userManagement.processingUser === row.id ? "Processing..." : "Delete",
                  icon: (row) => userManagement.processingUser === row.id ? "mdi:loading" : "mdi:delete",
                  className: "hover:bg-red-100 text-red-600",
                  onClick: (row) => {
                    if (userManagement.processingUser !== row.id) {
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
                    {adminManagement.isSuperAdmin 
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
                {adminManagement.isSuperAdmin && (
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
                {adminManagement.adminUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon icon="mdi:shield-account" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No admin users found or you don&apos;t have permission to view them.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminManagement.adminUsers.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-ndsi-blue flex items-center justify-center">
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
                            {adminManagement.isSuperAdmin && admin.id !== adminUser?.id && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditAdminClick(admin)}
                                  className="p-1 text-ndsi-blue hover:text-ndsi-green hover:bg-ndsi-blue rounded"
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

        {/* Modals */}
        <AddAdminModal
          isOpen={showAddAdminModal}
          onClose={() => setShowAddAdminModal(false)}
          onSubmit={handleAddAdmin}
          loading={adminManagement.addAdminLoading}
        />

        {/* Rejection Reason Modal */}
        <SimpleModal
          isOpen={showRejectionModal}
          onClose={() => setShowRejectionModal(false)}
          title="Reject User"
          width="max-w-md"
        >
          <div className="space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to reject{" "}
                <span className="font-semibold text-gray-900">
                  {userToReject?.full_name || userToReject?.email}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ndsi-blue focus:border-ndsi-blue resize-none"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={userManagement.processingUser === userToReject?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {userManagement.processingUser === userToReject?.id ? (
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
            {userManagement.getApprovedUsers().length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="mdi:check-circle" className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No users have been approved today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userManagement.getApprovedUsers().map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-ndsi-green flex items-center justify-center">
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
            {userManagement.getRejectedUsers().length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="mdi:close-circle" className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">No users have been rejected today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userManagement.getRejectedUsers().map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
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

        {/* Delete Confirmation Modal */}
        <SimpleModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
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
                  {userToDelete?.full_name || userToDelete?.email}
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
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={userManagement.processingUser === userToDelete?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {userManagement.processingUser === userToDelete?.id ? (
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

        {/* Bulk Delete Confirmation Modal */}
        <SimpleModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
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
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkDelete(selectedUsers.map(user => user.id))}
                disabled={userManagement.processingUser === 'bulk'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {userManagement.processingUser === 'bulk' ? (
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

        {/* Edit Admin Modal */}
        <SimpleModal
          isOpen={showEditAdminModal}
          onClose={() => setShowEditAdminModal(false)}
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
                onClick={() => setShowEditAdminModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditAdmin}
                disabled={adminManagement.editAdminLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {adminManagement.editAdminLoading ? (
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
          onClose={() => setShowDeleteAdminModal(false)}
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
                onClick={() => setShowDeleteAdminModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={adminManagement.deleteAdminLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {adminManagement.deleteAdminLoading ? (
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