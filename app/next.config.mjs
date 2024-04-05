// next.config.mjs
import webpack from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore certain packages by making them resolve to empty mocks on the client side
      if (!config.resolve) config.resolve = {};
      if (!config.resolve.alias) config.resolve.alias = {};

      // Aliasing the packages to false will tell Webpack to replace them with an empty module when bundled for the client-side.
      config.resolve.alias['lokijs'] = false;
      config.resolve.alias['pino-pretty'] = false;
      config.resolve.alias['encoding'] = false;

      // Providing fallbacks for Node.js core modules that might be used by some dependencies. Adjust according to your needs.
      config.resolve.fallback = {
        fs: false, // Replace 'fs' module with an empty module
        path: false, // Replace 'path' module with an empty module
        os: false, // Replace 'os' module with an empty module
        // Include other Node.js modules here if needed.
      };
    }

    return config;
  },
};

export default nextConfig;
