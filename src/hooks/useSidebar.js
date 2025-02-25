// useSidebar.js
import { useState, useEffect } from 'react';

const useSidebar = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setSidebarOpen(window.innerWidth > 768);
        }
    }, []);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return { isSidebarOpen, toggleSidebar };
};

export default useSidebar;
