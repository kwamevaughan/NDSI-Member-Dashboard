// @/context/UserContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('custom_auth_token');
        const storedUser = localStorage.getItem('custom_auth_user');
        if (storedToken && storedUser) {
            fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: storedToken }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.valid) {
                        setToken(storedToken);
                        setUser(JSON.parse(storedUser));
                    } else {
                        setToken(null);
                        setUser(null);
                        localStorage.removeItem('custom_auth_token');
                        localStorage.removeItem('custom_auth_user');
                    }
                    setIsLoading(false);
                })
                .catch(error => {
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem('custom_auth_token');
                    localStorage.removeItem('custom_auth_user');
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (email, password, recaptchaToken, isAutoLogin = false) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, recaptchaToken, isAutoLogin }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('custom_auth_token', data.token);
        localStorage.setItem('custom_auth_user', JSON.stringify(data.user));

        return data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('custom_auth_token');
        localStorage.removeItem('custom_auth_user');
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