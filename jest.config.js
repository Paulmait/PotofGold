module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@react-native-async-storage/async-storage)'
  ],
  testPathIgnorePatterns: [
    '/__tests__/e2e/',
    '/e2e/'
  ],
};
