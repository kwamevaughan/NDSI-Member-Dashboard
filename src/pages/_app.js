// src/pages/_app.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { UserProvider, useUser } from '@/context/UserContext';
import SessionExpired from '../components/SessionExpired';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
    const [mode, setMode] = useState('light');
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const savedMode = localStorage.getItem('mode');
        if (savedMode) {
            setMode(savedMode);
        } else {
            const systemMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setMode(systemMode);
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (!localStorage.getItem('mode') || localStorage.getItem('mode') === 'system') {
                setMode(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return (
        <UserProvider>
            <Head>
                <title>NDSI Member Dashboard</title>
                <meta name="description" content="NDSI Member Dashboard - Access your member portal" />
            </Head>
            <UserComponent
                mode={mode}
                isSessionExpired={isSessionExpired}
                setIsSessionExpired={setIsSessionExpired}
                router={router}
                Component={Component}
                pageProps={pageProps}
            />
            <Toaster 
                position="top-center"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: mode === 'dark' ? '#374151' : '#fff',
                        color: mode === 'dark' ? '#fff' : '#374151',
                        border: mode === 'dark' ? '1px solid #4B5563' : '1px solid #E5E7EB',
                    },
                }}
            />
        </UserProvider>
    );
}

const UserComponent = ({ mode, isSessionExpired, setIsSessionExpired, router, Component, pageProps }) => {
    const { token, isLoading } = useUser();

    useEffect(() => {
        if (isLoading) return;

        const excludedPaths = ['/', '/reset-password', '/admin/login'];
        const adminPaths = ['/admin/dashboard'];
        
        // Don't check authentication for excluded paths
        if (excludedPaths.includes(router.pathname)) {
            setIsSessionExpired(false);
            return;
        }
        
        // For admin paths, let the admin pages handle their own authentication
        if (adminPaths.includes(router.pathname)) {
            setIsSessionExpired(false);
            return;
        }
        
        // For all other paths, check regular user authentication
        if (!token) {
            setIsSessionExpired(true);
            router.push('/');
        } else {
            setIsSessionExpired(false);
        }
    }, [router.pathname, token, isLoading, setIsSessionExpired]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isSessionExpired && router.pathname !== '/' && router.pathname !== '/admin/login') {
        return <SessionExpired isSessionExpired={isSessionExpired} />;
    }

    return (
        <div className={mode === 'dark' ? 'dark' : ''}>
            <Component {...pageProps} mode={mode} />
        </div>
    );
};

export default MyApp;