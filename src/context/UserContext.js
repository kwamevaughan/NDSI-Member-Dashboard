// @/context/UserContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('UserContext useEffect running');
        const storedToken = localStorage.getItem('custom_auth_token');
        const storedUser = localStorage.getItem('custom_auth_user');
        if (storedToken && storedUser) {
            console.log('Verifying stored token:', storedToken);
            fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: storedToken }),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Verify response:', data);
                    if (data.valid) {
                        setToken(storedToken);
                        setUser(JSON.parse(storedUser));
                        console.log('Session restored: token=', storedToken);
                    } else {
                        setToken(null);
                        setUser(null);
                        if (!localStorage.getItem('rememberMe')) { // Set this in login
                            localStorage.removeItem('custom_auth_token');
                            localStorage.removeItem('custom_auth_user');
                        }
                        localStorage.removeItem('custom_auth_token');
                        localStorage.removeItem('custom_auth_user');
                        console.log('Invalid token, cleared session');
                    }
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Verify error:', error);
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem('custom_auth_token');
                    localStorage.removeItem('custom_auth_user');
                    setIsLoading(false);
                });
        } else {
            console.log('No stored token/user, skipping verify');
            setIsLoading(false);
        }
    }, []);

    const login = async (email, password, recaptchaToken) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, recaptchaToken }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('custom_auth_token', data.token);
        localStorage.setItem('custom_auth_user', JSON.stringify(data.user));
        console.log('Login successful: token=', data.token);

        return data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('custom_auth_token');
        localStorage.removeItem('custom_auth_user');
        console.log('Logged out');
    };

    return (
        <UserContext.Provider value={{ token, setToken, user, setUser, login, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}