module.exports = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'asfrgctjmmfiilocuzor.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
            },
            {
                protocol: 'https',
                hostname: 'sustainableinsurancedeclaration.org',
            },
        ],
    },
    env: {
        IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
        IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
        IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT,
    },
};
