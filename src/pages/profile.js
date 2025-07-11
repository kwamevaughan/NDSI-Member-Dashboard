import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from "@/layouts/header";
import Sidebar from "@/layouts/sidebar";
import toast from 'react-hot-toast';
import useTheme from '@/hooks/useTheme';
import useSidebar from '@/hooks/useSidebar';
import { useUser } from '@/context/UserContext';
import useSignOut from '@/hooks/useSignOut';
import { FaUser, FaBuilding, FaBriefcase, FaUserCircle, FaLock, FaKey, FaEnvelope } from 'react-icons/fa';

const ProfilePage = () => {
    const router = useRouter();
    const { mode, toggleMode } = useTheme();
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const { handleSignOut } = useSignOut();
    const { user, token, setUser } = useUser();

    // Profile state
    const [first_name, setFirstName] = useState(user?.first_name || '');
    const [last_name, setLastName] = useState(user?.last_name || '');
    const [organization_name, setOrganizationName] = useState(user?.organization_name || '');
    const [role_job_title, setRoleJobTitle] = useState(user?.role_job_title || '');
    const [full_name, setFullName] = useState(user?.full_name || '');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Update profile handler
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess(false);
        setProfileLoading(true);
        try {
            const res = await fetch('/api/updateProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ first_name, last_name, organization_name, role_job_title, full_name }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update profile');
            setProfileSuccess(true);
            setUser && setUser(data.user);
            localStorage.setItem('custom_auth_user', JSON.stringify(data.user));
            toast.success('Profile updated successfully!');
        } catch (err) {
            setProfileError(err.message);
            toast.error(err.message);
        } finally {
            setProfileLoading(false);
        }
    };

    // Change password handler
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);
        setPasswordLoading(true);
        try {
            const res = await fetch('/api/changePassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to change password');
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            toast.success('Password changed successfully!');
        } catch (err) {
            setPasswordError(err.message);
            toast.error(err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className={`flex flex-col h-screen ${mode === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#f7f1eb]'}`}>
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
                <div
                    className={`flex-1 transition-margin duration-300 ${
                        isSidebarOpen ? 'lg:ml-[250px]' : 'ml-0 lg:ml-[80px]'
                    }`}
                >
                    <main
                        className={`p-4 md:p-8 ${
                            isSidebarOpen
                                ? 'pt-[60px] md:pt-[70px]'
                                : 'pt-[80px] md:pt-[120px]'
                        } ${mode === 'dark' ? 'bg-[#0a0c1d] text-white' : 'bg-[#ececec] text-black'} w-full min-h-screen`}
                    >
                        <div className="space-y-10 mt-10">
                            <h2 className="text-4xl font-semibold text-[#28A8E0] mb-4 text-center">My Profile</h2>
                            {/* Profile Card */}
                            <div className={`rounded-lg shadow-lg p-8 border mx-auto max-w-2xl ${mode === 'dark' ? 'bg-[#181f2a] border-[#232a36] text-white' : 'bg-white border-[#e0e0e0] text-black'}`}>
                                <form onSubmit={handleProfileSubmit}>
                                    <h3 className="text-2xl font-bold text-[#28A8E0] mb-6 flex items-center gap-2"><FaUserCircle /> Profile Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="relative">
                                            <FaUser className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="text"
                                                value={first_name}
                                                onChange={e => setFirstName(e.target.value)}
                                                className={`w-full pl-10 p-2 rounded focus:outline-none transition-all border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-white placeholder-gray-400' : 'border-[#28A8E0] text-black placeholder-gray-500'}`}
                                                placeholder="First Name"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <FaUser className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="text"
                                                value={last_name}
                                                onChange={e => setLastName(e.target.value)}
                                                className={`w-full pl-10 p-2 rounded focus:outline-none transition-all border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-white placeholder-gray-400' : 'border-[#28A8E0] text-black placeholder-gray-500'}`}
                                                placeholder="Last Name"
                                                required
                                            />
                                        </div>
                                        <div className="relative md:col-span-2">
                                            <FaEnvelope className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                className={`w-full pl-10 p-2 rounded bg-gray-100 cursor-not-allowed border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-gray-400' : 'border-[#28A8E0] text-gray-500'}`}
                                                placeholder="Email"
                                                disabled
                                            />
                                        </div>
                                        <div className="relative">
                                            <FaBuilding className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="text"
                                                value={organization_name}
                                                onChange={e => setOrganizationName(e.target.value)}
                                                className={`w-full pl-10 p-2 rounded focus:outline-none transition-all border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-white placeholder-gray-400' : 'border-[#28A8E0] text-black placeholder-gray-500'}`}
                                                placeholder="Organization Name"
                                            />
                                        </div>
                                        <div className="relative">
                                            <FaBriefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="text"
                                                value={role_job_title}
                                                onChange={e => setRoleJobTitle(e.target.value)}
                                                className={`w-full pl-10 p-2 rounded focus:outline-none transition-all border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-white placeholder-gray-400' : 'border-[#28A8E0] text-black placeholder-gray-500'}`}
                                                placeholder="Role / Job Title"
                                            />
                                        </div>
                                        <div className="relative md:col-span-2">
                                            <FaUserCircle className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="text"
                                                value={full_name}
                                                onChange={e => setFullName(e.target.value)}
                                                className={`w-full pl-10 p-2 rounded focus:outline-none transition-all border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-white placeholder-gray-400' : 'border-[#28A8E0] text-black placeholder-gray-500'}`}
                                                placeholder="Full Name"
                                            />
                                        </div>
                                    </div>
                                    {profileError && <p className="text-red-500 text-sm mb-4 text-center">{profileError}</p>}
                                    {profileSuccess && <p className="text-green-600 text-sm mb-4 text-center">Profile updated successfully!</p>}
                                    <button
                                        type="submit"
                                        className={`w-full px-4 py-3 font-bold rounded-lg transition-all duration-300 text-lg shadow-md disabled:opacity-60 ${mode === 'dark' ? 'bg-[#28A8E0] text-white hover:bg-[#8DC63F]' : 'bg-[#28A8E0] text-white hover:bg-[#8DC63F]'}`}
                                        disabled={profileLoading}
                                    >
                                        {profileLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </form>
                            </div>
                            {/* Password Card */}
                            <div className={`rounded-lg shadow-lg p-8 border mx-auto max-w-2xl ${mode === 'dark' ? 'bg-[#181f2a] border-[#232a36] text-white' : 'bg-white border-[#e0e0e0] text-black'}`}>
                                <form onSubmit={handlePasswordSubmit}>
                                    <h3 className="text-2xl font-bold text-[#28A8E0] mb-6 flex items-center gap-2"><FaLock /> Change Password</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="relative">
                                            <FaKey className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                className={`w-full pl-10 p-2 rounded focus:outline-none transition-all border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-white placeholder-gray-400' : 'border-[#28A8E0] text-black placeholder-gray-500'}`}
                                                placeholder="Current Password"
                                                required
                                            />
                                        </div>
                                        <div className="relative">
                                            <FaLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                className={`w-full pl-10 p-2 rounded focus:outline-none transition-all border ${mode === 'dark' ? 'bg-[#232a36] border-[#2c3440] text-white placeholder-gray-400' : 'border-[#28A8E0] text-black placeholder-gray-500'}`}
                                                placeholder="New Password"
                                                required
                                            />
                                        </div>
                                    </div>
                                    {passwordError && <p className="text-red-500 text-sm mb-4 text-center">{passwordError}</p>}
                                    {passwordSuccess && <p className="text-green-600 text-sm mb-4 text-center">Password changed successfully!</p>}
                                    <button
                                        type="submit"
                                        className={`w-full px-4 py-3 font-bold rounded-lg transition-all duration-300 text-lg shadow-md disabled:opacity-60 ${mode === 'dark' ? 'bg-[#28A8E0] text-white hover:bg-[#8DC63F]' : 'bg-[#28A8E0] text-white hover:bg-[#8DC63F]'}`}
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? 'Changing...' : 'Change Password'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;