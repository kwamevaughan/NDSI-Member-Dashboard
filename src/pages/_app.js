// src/pages/_app.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { UserProvider, useUser } from '@/context/UserContext';
import SessionExpired from '../components/SessionExpired';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
            <UserComponent
                mode={mode}
                isSessionExpired={isSessionExpired}
                setIsSessionExpired={setIsSessionExpired}
                router={router}
                Component={Component}
                pageProps={pageProps}
            />
            <ToastContainer position="top-center" />
        </UserProvider>
    );
}

const UserComponent = ({ mode, isSessionExpired, setIsSessionExpired, router, Component, pageProps }) => {
    const { token, isLoading } = useUser();

    useEffect(() => {
        if (isLoading) return;

        const excludedPaths = ['/', '/reset-password'];
        if (!excludedPaths.includes(router.pathname)) {
            if (!token) {
                setIsSessionExpired(true);
                router.push('/');
            } else {
                setIsSessionExpired(false);
            }
        }
    }, [router.pathname, token, isLoading, setIsSessionExpired]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isSessionExpired && router.pathname !== '/') {
        return <SessionExpired isSessionExpired={isSessionExpired} />;
    }

    return (
        <div className={mode === 'dark' ? 'dark' : ''}>
            <Component {...pageProps} mode={mode} />
        </div>
    );
};

export default MyApp;