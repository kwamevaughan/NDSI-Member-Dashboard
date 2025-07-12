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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [roleJobTitle, setRoleJobTitle] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validate passwords match
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            setError('Passwords do not match');
            return;
        }

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
                    full_name: fullName,
                    organization_name: organizationName,
                    role_job_title: roleJobTitle,
                    recaptchaToken: captchaToken,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            toast.dismiss(toastId);
            
            // Check if user requires approval
            if (data.requiresApproval) {
                toast.success('Registration successful! Your account is pending approval. You will receive an email notification once approved.');
                closeRegister(); // Close the registration modal
                return;
            }
            
            // If no approval required, proceed with auto-login
            const loginResult = await login(email, password, null);
            if (loginResult && loginResult.token) {
                const welcomeMessage = `Authenticated, Welcome ${fullName || 'User'}`;
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

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
        onCaptchaChange(token);
    };

    return (
        <form onSubmit={handleRegister}>
            <div className="mt-8">
                <label className="text-gray-900 text-sm mb-2">Full Name</label>
                <input
                    className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your official name"
                    required
                />
            </div>

            <div className="mt-4">
                <label className="text-gray-900 text-sm mb-2">E-mail</label>
                <div className="flex items-center border border-[#28A8E0] rounded focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out">
                    <input
                        className="bg-transparent py-2 px-4 block w-full rounded"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Example@gmail.com"
                        required
                    />
                </div>
            </div>

            <div className="mt-4">
                <label className="text-gray-900 text-sm mb-2">Organization Name</label>
                <input
                    className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="E.g. Value Village, Equity Bank, etc."
                    required
                />
            </div>

            <div className="mt-4">
                <label className="text-gray-900 text-sm mb-2">Role / Job Title</label>
                <input
                    className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                    type="text"
                    value={roleJobTitle}
                    onChange={(e) => setRoleJobTitle(e.target.value)}
                    placeholder="Let us know your position within your organization."
                    required
                />
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
                <label className="text-gray-900 text-sm mb-2">Confirm Password</label>
                <div className="relative">
                    <span
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                        onClick={toggleConfirmPasswordVisibility}
                    >
                        {showConfirmPassword ? (
                            <FaEyeSlash className="text-gray-500 h-5 w-5" />
                        ) : (
                            <FaEye className="text-gray-500 h-5 w-5" />
                        )}
                    </span>
                    <input
                        className="bg-transparent border border-[#28A8E0] rounded py-2 px-4 block w-full focus:outline-none focus:border-fuchsia-900 hover:border-fuchsia-900 transition-all duration-700 ease-in-out"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                    />
                </div>
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