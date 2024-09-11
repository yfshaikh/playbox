// Import the NextConfig type if you want TypeScript support
// import type { NextConfig } from 'next';

// Define the configuration
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/processed-thumbnail-bucket-yt/**', // Adjust path pattern as needed
      },
    ],
  },
};

// Export the configuration
export default nextConfig;
