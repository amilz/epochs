// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, context, { isServer }) => {
    if (config.plugins) {
      config.plugins.push(
        new context.webpack.IgnorePlugin({
          resourceRegExp: /^(lokijs|pino-pretty|encoding)$/,
        }),
      )
    }
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
};

export default nextConfig;
