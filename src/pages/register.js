// src/pages/register.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from 'lib/supabase';
import { toast } from 'react-hot-toast';
import { FaRegEnvelope, FaEye, FaEyeSlash, FaUser, FaPhone } from 'react-icons/fa';
import ReCAPTCHA from 'react-google-recaptcha';
import { useUser } from '@/context/UserContext';

export default function Register({ closeRegister, notify, setError, router, recaptchaRef, onCaptchaChange }) {
    const { login } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!captchaToken) {
            setLocalError('Please complete the CAPTCHA');
            setError('Please complete the CAPTCHA');
            return;
        }
        setLocalError('');
        setError('');
        const toastId = notify('Please wait...');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    recaptchaToken: captchaToken,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            toast.dismiss(toastId);
            // Skip reCAPTCHA for auto-login since it's already verified
            const loginResult = await login(email, password, null);
            if (loginResult && loginResult.token) {
                const welcomeMessage = `Authenticated, Welcome ${firstName || 'User'}`;
                toast.success(welcomeMessage);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 100);
            } else {
                throw new Error('Auto-login failed after registration');
            }
        } catch (error) {
            toast.dismiss(toastId);
            setLocalError(error.message);
            setError(error.message);
            toast.error(`Registration failed: ${error.message}`);
            setCaptchaToken(null);
            if (recaptchaRef.current) recaptchaRef.current.reset();
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
        onCaptchaChange(token);
    };

    return (
        <form onSubmit={handleRegister}>
            <div className="mt-8">
                <label className="text-gray-900 text-sm mb-2">E-mail</label>
                <div className="flex items-center border border-[#28A8E0] rounded focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out">
                    <input
                        className="bg-transparent py-2 px-4 block w-full rounded"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        required
                    />
                </div>
            </div>

            <div className="mt-4">
                <label className="text-gray-900 text-sm mb-2">Password</label>
                <div className="relative">
                    <span
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        onClick={togglePasswordVisibility}
                    >
                        {showPassword ? (
                            <FaEyeSlash className="text-gray-500 h-5 w-5" />
                        ) : (
                            <FaEye className="text-gray-500 h-5 w-5" />
                        )}
                    </span>
                    <input
                        className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
            </div>

            <div className="mt-4">
                <label className="text-gray-900 text-sm mb-2">First Name</label>
                <input
                    className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                />
            </div>

            <div className="mt-4">
                <label className="text-gray-900 text-sm mb-2">Last Name</label>
                <input
                    className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                />
            </div>

            <div className="mt-4">
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                />
            </div>

            {localError && (
                <p className="mt-2 text-red-500 text-sm">{localError}</p>
            )}

            <div className="mt-8">
                <button
                    type="submit"
                    className="bg-[#28A8E0] text-white font-bold py-4 px-4 w-full rounded-lg transform transition-transform duration-700 ease-in-out hover:scale-105"
                >
                    Register
                </button>
            </div>
        </form>
    );
}