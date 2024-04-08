// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // This condition ensures that the following code block will only be executed on the client side.
    if (!isServer) {
      // Provide empty implementations for Node.js modules that might cause issues when bundled for the client-side.
      config.resolve.fallback = {
        fs: false, // Prevent webpack from trying to bundle 'fs' module for the client-side.
        // Add other Node.js modules here if necessary, for example:
        // path: false,
        // os: false,
        // etc.
      };
    }

    // Always return the modified config.
    return config;
  },
  async redirects() {
    return [
      {
        source: '/drip',
        destination: 'https://docs.google.com/presentation/d/1mYgCZ-BYutCIzu98pXSHVva6i6_Xg68ia6Dokgof_nw/',
        permanent: true,
      },
      {
        source: '/github',
        destination: 'https://github.com/amilz/epochs',
        permanent: true,
      }
    ]
  }
};

export default nextConfig;
