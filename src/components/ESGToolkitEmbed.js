import { useState, useEffect } from 'react';

const ESGToolkitEmbed = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Set a timeout to handle loading issues
        const timeout = setTimeout(() => {
            if (isLoading) {
                setError('Loading is taking longer than expected. Please refresh the page.');
            }
        }, 15000);

        return () => clearTimeout(timeout);
    }, [isLoading]);

    const handleLoad = () => {
        setIsLoading(false);
        setError(null);
    };

    const handleError = () => {
        setIsLoading(false);
        setError('Failed to load ESG Toolkit. Please try refreshing the page.');
    };

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28A8E0] mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">Loading ESG Toolkit...</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            This may take a few moments
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
                    <div className="text-center max-w-md">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-[#28A8E0] text-white rounded-lg hover:bg-[#1f8bc0] transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            )}

            <iframe
                src="/esg-toolkit/index.html"
                className="w-full h-[calc(100vh-200px)] border-0 rounded-lg shadow-lg"
                onLoad={handleLoad}
                onError={handleError}
                title="ESG Toolkit"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                loading="lazy"
            />
        </div>
    );
};

export default ESGToolkitEmbed; 