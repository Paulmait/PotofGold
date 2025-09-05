const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  // Create the default Expo webpack config
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      // Don't use offline flag - it's deprecated
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          'react-native-reanimated',
          'react-native-gesture-handler',
          'react-native-screens',
          'react-native-safe-area-context',
          '@react-native-community/netinfo',
          'react-native-vector-icons',
        ],
      },
    },
    argv
  );

  // Disable problematic plugins
  config.plugins = config.plugins.filter(plugin => {
    const name = plugin.constructor.name;
    // Remove service worker plugin that might cause issues
    return name !== 'GenerateSW' && name !== 'InjectManifest';
  });

  // Simplified resolve configuration
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      'react-native$': 'react-native-web',
      'react-native-linear-gradient': 'react-native-web-linear-gradient',
      // Disable problematic modules for web
      '@sentry/react-native': false,
      'react-native-sound': false,
      'expo-haptics': false,
      'expo-av': false,
      'expo-battery': false,
      'expo-cellular': false,
      'expo-sensors': false,
      'expo-notifications': false,
      'expo-in-app-purchases': false,
      'react-native-purchases': false,
    },
  };

  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
    stream: false,
    buffer: false,
  };

  // Ignore native modules that don't work on web
  config.module.rules.push({
    test: /\.(js|jsx|ts|tsx)$/,
    loader: 'string-replace-loader',
    options: {
      multiple: [
        {
          search: "import.*@sentry/react-native.*",
          replace: '// Sentry disabled for web',
          flags: 'g'
        },
        {
          search: "from '@sentry/react-native'",
          replace: '// from Sentry',
          flags: 'g'
        },
      ],
    },
  });

  // Ensure proper public path
  config.output = {
    ...config.output,
    publicPath: '/',
  };

  // Disable source maps in production for smaller bundle
  if (config.mode === 'production') {
    config.devtool = false;
  }

  return config;
};