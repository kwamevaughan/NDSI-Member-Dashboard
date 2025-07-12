import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { Icon } from '@iconify/react';
import ReCAPTCHA from 'react-google-recaptcha';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const recaptchaRef = useRef(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!captchaToken) {
            setError('Please complete the CAPTCHA');
            return;
        }
        
        setError('');
        setLoading(true);
        const toastId = toast.loading('Signing in...');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    recaptchaToken: captchaToken,
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (data.requiresApproval) {
                    throw new Error('This account is pending approval. Please contact an administrator.');
                }
                throw new Error(data.error || 'Login failed');
            }

            // Check if user is admin
            if (!data.user.is_admin) {
                throw new Error('Access denied. Admin privileges required.');
            }

            toast.dismiss(toastId);
            toast.success('Welcome, Admin!');
            
            // Store admin session
            localStorage.setItem('admin_token', data.token);
            localStorage.setItem('admin_user', JSON.stringify(data.user));
            
            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 100);
        } catch (error) {
            toast.dismiss(toastId);
            setError(error.message);
            toast.error(error.message);
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    const onCaptchaChange = (token) => {
        setCaptchaToken(token);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <Image
                            src="https://ik.imagekit.io/3x197uc7r/NDSI/nds_logo.png"
                            alt="NDSI Logo"
                            width={200}
                            height={80}
                            className="h-20 w-auto"
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Admin Portal
                    </h2>
                    <p className="text-gray-600">
                        Sign in to manage user approvals
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon icon="mdi:email" className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icon icon="mdi:lock" className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <Icon icon="mdi:eye-off" className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Icon icon="mdi:eye" className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                                onChange={onCaptchaChange}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || !captchaToken}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <Link 
                            href="/" 
                            className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200 underline"
                        >
                            ← Back to Member Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
} 