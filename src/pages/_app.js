// src/pages/_app.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { UserProvider, useUser } from '@/context/UserContext';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import SessionExpired from '../components/SessionExpired';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <Head>
          <title>NDSI Member Dashboard</title>
          <meta name="description" content="NDSI Member Dashboard - Access your member portal" />
        </Head>
        <UserComponent Component={Component} pageProps={pageProps} />
      </UserProvider>
    </ThemeProvider>
  );
}

const UserComponent = ({ Component, pageProps }) => {
  const { mode, toggleMode } = useTheme();
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const router = useRouter();
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
            <Component {...pageProps} mode={mode} toggleMode={toggleMode} />
        </div>
    );
};

export default MyApp;