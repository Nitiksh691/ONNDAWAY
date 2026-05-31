/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allows HMR to work on the user's mobile device
  allowedDevOrigins: ['192.168.0.118:3000', 'localhost:3000']
};

export default nextConfig;
