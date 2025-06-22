// useSidebar.js
import { useState, useEffect } from 'react';

const useSidebar = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Try to get saved state from localStorage
            const savedState = localStorage.getItem('sidebarOpen');
            
            if (savedState !== null) {
                // Use saved state if available
                setSidebarOpen(JSON.parse(savedState));
            } else {
                // Default to open on desktop, closed on mobile
                setSidebarOpen(window.innerWidth > 768);
            }
        }
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(prev => {
            const newState = !prev;
            // Save to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('sidebarOpen', JSON.stringify(newState));
            }
            return newState;
        });
    };

    return { isSidebarOpen, toggleSidebar };
};

export default useSidebar;
