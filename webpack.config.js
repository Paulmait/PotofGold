const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
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
      // offline: true, // Deprecated - using workbox plugin instead
    },
    argv
  );

  // Customize the config for better web performance
  if (config.mode === 'production') {
    // Optimization for production
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };
  }

  // Add PWA manifest
  config.plugins.push(
    new (require('webpack-pwa-manifest'))({
      name: 'Pot of Gold',
      short_name: 'PotOfGold',
      description: 'An exciting mobile game where you collect falling treasures!',
      background_color: '#1a1a2e',
      theme_color: '#FFD700',
      display: 'fullscreen',
      orientation: 'any',
      start_url: '/',
      icons: [
        {
          src: path.resolve('assets/images/pot_of_gold_icon.png'),
          sizes: [96, 128, 192, 256, 384, 512],
        },
      ],
    })
  );

  // Add service worker for offline support
  if (config.mode === 'production') {
    config.plugins.push(
      new (require('workbox-webpack-plugin').GenerateSW)({
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
            },
          },
        ],
      })
    );
  }

  // Handle web-specific aliases
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native-linear-gradient': 'react-native-web-linear-gradient',
  };

  return config;
};