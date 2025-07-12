import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { FaUser, FaBuilding, FaBriefcase, FaCalendar, FaCheck, FaTimes, FaSignOutAlt, FaUsers } from 'react-icons/fa';
import Image from 'next/image';

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingUser, setProcessingUser] = useState(null);
    const [adminUser, setAdminUser] = useState(null);

    useEffect(() => {
        // Check admin authentication
        const adminToken = localStorage.getItem('admin_token');
        const adminUserData = localStorage.getItem('admin_user');

        if (!adminToken || !adminUserData) {
            router.push('/admin/login');
            return;
        }

        try {
            const user = JSON.parse(adminUserData);
            setAdminUser(user);
            fetchPendingUsers(adminToken);
        } catch (error) {
            console.error('Error parsing admin user data:', error);
            router.push('/admin/login');
        }
    }, [router]);

    const fetchPendingUsers = async (token) => {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_user');
                    router.push('/admin/login');
                    return;
                }
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load pending users');
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (userId, action, reason = null) => {
        setProcessingUser(userId);
        const adminToken = localStorage.getItem('admin_token');

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    userId,
                    action,
                    reason
                })
            });

            if (!response.ok) {
                throw new Error('Failed to process user');
            }

            const data = await response.json();
            toast.success(data.message);
            
            // Refresh the users list
            fetchPendingUsers(adminToken);
        } catch (error) {
            console.error('Error processing user:', error);
            toast.error('Failed to process user');
        } finally {
            setProcessingUser(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin/login');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <Image
                                src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png"
                                alt="NDSI Logo"
                                width={150}
                                height={60}
                                className="h-12 w-auto"
                            />
                            <div className="ml-4">
                                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                                <p className="text-sm text-gray-500">User Approval Management</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                    {adminUser?.full_name || adminUser?.email}
                                </p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <FaSignOutAlt className="mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <FaUsers className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                Pending Approvals
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {users.length}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Pending User Approvals
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Review and approve new user registrations
                            </p>
                        </div>

                        {users.length === 0 ? (
                            <div className="text-center py-12">
                                <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    All user registrations have been processed.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <li key={user.id} className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <FaUser className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="flex items-center">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No name provided'}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                                                        <div className="flex items-center">
                                                            <FaUser className="mr-1" />
                                                            {user.email}
                                                        </div>
                                                        {user.organization_name && (
                                                            <div className="flex items-center">
                                                                <FaBuilding className="mr-1" />
                                                                {user.organization_name}
                                                            </div>
                                                        )}
                                                        {user.role_job_title && (
                                                            <div className="flex items-center">
                                                                <FaBriefcase className="mr-1" />
                                                                {user.role_job_title}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center">
                                                            <FaCalendar className="mr-1" />
                                                            {formatDate(user.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleApproval(user.id, 'approve')}
                                                    disabled={processingUser === user.id}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processingUser === user.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ) : (
                                                        <>
                                                            <FaCheck className="mr-1" />
                                                            Approve
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Please provide a reason for rejection (optional):');
                                                        if (reason !== null) {
                                                            handleApproval(user.id, 'reject', reason);
                                                        }
                                                    }}
                                                    disabled={processingUser === user.id}
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processingUser === user.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ) : (
                                                        <>
                                                            <FaTimes className="mr-1" />
                                                            Reject
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
} 