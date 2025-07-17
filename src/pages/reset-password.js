// src/pages/reset-password.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { token } = router.query;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        const toastId = toast('Please wait...');

        try {
            const response = await fetch('/api/resetPassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            toast.dismiss(toastId);
            toast.success('Password reset successful! Redirecting to login...');
            setSuccess(true);
            setTimeout(() => router.push('/'), 2000);
        } catch (error) {
            toast.dismiss(toastId);
            setError(error.message);
            toast.error(`Error: ${error.message}`);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
      <div
        className="w-full min-h-screen flex items-center justify-center bg-cover bg-center py-8 px-4"
        style={{ backgroundImage: `url('/assets/images/form-bg.png')` }}
      >
      <div className="absolute inset-0 bg-black opacity-20"></div>

        <div className="bg-white/80 p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 backdrop-blur-sm">
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <Icon icon="mdi:home" className="h-10 w-10" />
            </Link>
          </div>
          <h2 className="text-3xl font-semibold mb-4 text-[#28A8E0] text-center">
            Reset Your Password
          </h2>
          <p className="mb-6 text-gray-600 text-center">
            Enter a new password for your NDSI account.
          </p>

          {success ? (
            <div className="text-center">
              <p className="text-[#8DC63F] text-lg">
                Password reset successful!
              </p>
              <p className="text-gray-600 mt-2">
                Redirecting to login in a moment...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] hover:border-[#8DC63F] transition-all duration-300 ease-in-out"
                    placeholder="Enter new password"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <Icon
                        icon="mdi:eye-off"
                        className="text-gray-500 h-5 w-5"
                      />
                    ) : (
                      <Icon icon="mdi:eye" className="text-gray-500 h-5 w-5" />
                    )}
                  </span>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] hover:border-[#8DC63F] transition-all duration-300 ease-in-out"
                    placeholder="Confirm new password"
                    required
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <Icon
                        icon="mdi:eye-off"
                        className="text-gray-500 h-5 w-5"
                      />
                    ) : (
                      <Icon icon="mdi:eye" className="text-gray-500 h-5 w-5" />
                    )}
                  </span>
                </div>
              </div>
              {error && (
                <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
              )}
              <button
                type="submit"
                className="w-full px-4 py-3 bg-[#28A8E0] text-white font-bold rounded-lg hover:bg-[#8DC63F] transform transition-all duration-300 ease-in-out hover:scale-105"
              >
                Reset Password
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-gray-600 text-sm">
            Back to{" "}
            <Link
              href="/"
              className="text-[#28A8E0] hover:text-[#8DC63F] hover:underline transition-colors duration-300"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    );
}