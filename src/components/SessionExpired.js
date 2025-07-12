import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

const SessionExpired = ({ isSessionExpired }) => {
    const [countdown, setCountdown] = useState(3);  // Countdown set to 3 seconds
    const router = useRouter();

    useEffect(() => {
        // If already on login page or admin login page, don't start countdown
        if (router.pathname === '/' || router.pathname === '/admin/login') return;

        // Proceed with countdown only if session has expired
        if (isSessionExpired) {
            const intervalId = setInterval(() => {
                if (countdown > 0) {
                    setCountdown(prev => prev - 1);
                } else {
                    console.log('Redirecting to /');
                    router.push('/');  // Redirect to login page if session expired
                }
            }, 1000);

            return () => clearInterval(intervalId);
        }
    }, [countdown, router, isSessionExpired]);

    const progress = ((3 - countdown) / 3) * 100;

    return (
        <div className="w-full bg-[#f7f1eb]">
            <div className="flex flex-col items-center justify-center w-full py-20">
                <div className="flex flex-col md:flex-row rounded-xl shadow-xl overflow-hidden max-w-sm lg:max-w-full w-full lg:w-3/4">
                    <div className="hidden md:block lg:w-1/2 bg-cover bg-center transition-all duration-700 ease-in-out" style={{backgroundImage: `url('/assets/images/form-bg.png')`}}></div>
                    <div className="w-full md:w-1/2 p-8 px-10 bg-white rounded-xl shadow-lg">
                        <div className="flex justify-center pb-8">
                            <Link href="/">
                                <Image src="/assets/images/logo.svg" alt="Logo" width={200} height={50}/>
                            </Link>
                        </div>

                        <p className="text-center text-3xl font-semibold leading-tight text-gray-800 mt-4 mb-6">
                            Your session has expired!
                        </p>
                        <p className="text-center text-base text-gray-600 mt-4">
                            Log in to track your progress, earn points, and stand a chance to win the Diaspora Champions Challenge.
                        </p>
                        <p className="text-center text-md text-gray-500 mt-6">
                            You will be redirected shortly. Please hold on.
                        </p>

                        <div className="my-6 flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 border-4 border-t-4 border-gray-400 rounded-full animate-spin" style={{borderTopColor: '#0CB4AB'}}></div>
                            <p className="mt-2 text-sm text-gray-600">Redirecting in {countdown}s</p>
                            <div className="w-full mt-4">
                                <div className="bg-gray-200 h-2 rounded-full">
                                    <div className="bg-[#0CB4AB] h-2 rounded-full transition-all duration-1000" style={{width: `${progress}%`}}></div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-6">
                            Not redirected? Click <Link href="/" className="text-[#0CB4AB] hover:underline">here</Link> to continue.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionExpired;
