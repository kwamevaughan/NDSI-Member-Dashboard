// src/components/forgotPassword.js
import { useState } from 'react';
import { toast } from 'react-toastify'; // Import toast directly

export default function ForgotPasswordModal({ isOpen, closeModal, notify }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const toastId = notify('Please wait...');

        try {
            const response = await fetch('/api/sendPasswordReset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset link');
            }

            toast.dismiss(toastId); // Use toast.dismiss directly
            notify('If the email exists, a reset link has been sent.');
            setEmail('');
            closeModal();
        } catch (error) {
            toast.dismiss(toastId); // Use toast.dismiss directly
            setError(error.message);
            notify(`Error: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Forgot Password</h2>
                <p className="mb-4 text-gray-600">Enter your email to receive a password reset link.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#28A8E0]"
                            placeholder="example@gmail.com"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#28A8E0] text-white rounded hover:bg-fuchsia-900 transition-all duration-700 ease-in-out"
                        >
                            Send Reset Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}