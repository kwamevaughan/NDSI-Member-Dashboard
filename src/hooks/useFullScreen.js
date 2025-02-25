import { useCallback } from 'react';

const useFullScreen = () => {
    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) { // Check for fullscreen on both desktop and mobile
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen(); // Standard Fullscreen API
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(); // Safari / iOS Fullscreen API
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen(); // Firefox Fullscreen API
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen(); // IE/Edge Fullscreen API
            } else {
                console.error("Fullscreen API not supported.");
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen(); // Exit fullscreen for desktop
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen(); // Exit fullscreen for Safari/iOS
            } else {
                console.error("Exit fullscreen not supported.");
            }
        }
    }, []);

    return toggleFullScreen;
};

export default useFullScreen;
