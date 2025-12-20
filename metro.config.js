const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .mjs files (Firebase ESM modules)
config.resolver.sourceExts.push('mjs');

// Ensure .cjs files are also resolved
config.resolver.sourceExts.push('cjs');

// Handle Firebase ESM imports
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
