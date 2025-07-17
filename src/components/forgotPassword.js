// src/components/forgotPassword.js
import { useState } from 'react';
import toast from 'react-hot-toast';
import SimpleModal from './SimpleModal';

export default function ForgotPasswordModal({ isOpen, closeModal, notify }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Show loading toast immediately on click
        const toastId = toast.loading('Sending reset link...');

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

            toast.dismiss(toastId);
            notify('If the email exists, a reset link has been sent.');
            setEmail('');
            closeModal();
        } catch (error) {
            toast.dismiss(toastId);
            setError(error.message);
            notify(`Error: ${error.message}`);
        }
    };

    return (
        <SimpleModal
            isOpen={isOpen}
            onClose={closeModal}
            title="Forgot Password"
            width="max-w-md"
        >
            <p className="mb-6 text-gray-600 text-center">
                Enter your email below, and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border border-[#28A8E0] rounded focus:outline-none focus:border-[#8DC63F] hover:border-[#8DC63F] transition-all duration-300 ease-in-out"
                        placeholder="example@gmail.com"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-gray-600 hover:text-[#28A8E0] transition-colors duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-[#28A8E0] text-white font-bold rounded-lg hover:bg-[#8DC63F] transform transition-all duration-300 ease-in-out hover:scale-105"
                    >
                        Send Reset Link
                    </button>
                </div>
            </form>
        </SimpleModal>
    );
}