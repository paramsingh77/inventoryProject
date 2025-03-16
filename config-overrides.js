const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  console.log("Overriding webpack config");
  
  // Initialize fallback if it doesn't exist
  if (!config.resolve) config.resolve = {};
  if (!config.resolve.fallback) config.resolve.fallback = {};
  
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    url: require.resolve('url/'),
    stream: require.resolve('stream-browserify'),
    zlib: require.resolve('browserify-zlib'),
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/'),
    util: require.resolve('util/'),
    crypto: require.resolve('crypto-browserify'),
    querystring: require.resolve('querystring-es3'),
    fs: false,
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    process: false // Use false instead of require.resolve to handle ESM issues
  };
  
  // Add path aliases to help webpack find the right modules
  config.resolve.alias = {
    ...config.resolve.alias,
    process: path.resolve(__dirname, 'node_modules/process'),
    'process/browser': path.resolve(__dirname, 'node_modules/process/browser.js')
  };

  // Enhance module resolution capabilities
  config.resolve.modules = [
    path.resolve(__dirname, 'node_modules'),
    'node_modules'
  ];
  
  // Prefer relative paths
  config.resolve.preferRelative = true;

  // Add ProvidePlugin to automatically provide global variables
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process',
      Buffer: ['buffer', 'Buffer']
    })
  ]);

  // Optionally turn this on to see the webpack config
  // console.log("Final webpack config:", JSON.stringify(config, null, 2));
  
  return config;
}; 