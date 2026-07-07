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
  // Allows HMR (Hot Module Replacement) to work on mobile devices on the same
  // local network. The wildcard patterns cover common private subnets (10.x,
  // 192.168.x, 172.16-31.x) so you never have to update this when your IP
  // changes. These origins are ONLY trusted in development — they are
  // automatically ignored in production builds, so there is no security risk.
  allowedDevOrigins: [
    'localhost',
    '10.*',
    '192.168.*',
    '172.16.*',
    '172.17.*',
    '172.18.*',
    '172.19.*',
    '172.20.*',
    '172.21.*',
    '172.22.*',
    '172.23.*',
    '172.24.*',
    '172.25.*',
    '172.26.*',
    '172.27.*',
    '172.28.*',
    '172.29.*',
    '172.30.*',
    '172.31.*',
  ],
};

export default nextConfig;
