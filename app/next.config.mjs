// next.config.mjs

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Provide empty implementations for Node.js modules that might cause issues when bundled for the client-side.
      config.resolve.fallback = {
        fs: false, // Prevent webpack from trying to bundle 'fs' module for the client-side.
        path: false, // Prevent webpack from trying to bundle 'path' module for the client-side.
        os: false, // Prevent webpack from trying to bundle 'os' module for the client-side.
        // Add other Node.js modules here if necessary.
      };

      // Using webpack's IgnorePlugin to ignore specific modules/packages during the client-side bundling.
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(lokijs|pino-pretty|encoding)$/,
        })
      );
    }

    // Always return the modified config.
    return config;
  },
};

export default nextConfig;
