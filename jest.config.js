module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@react-native-async-storage/async-storage|@firebase|firebase|@react-native-firebase|expo(-.*)?|@expo(-.*)?|react-native-reanimated)'
  ],
  testPathIgnorePatterns: [
    '/__tests__/e2e/',
    '/e2e/'
  ],
  moduleNameMapper: {
    '^firebase/app$': '<rootDir>/__mocks__/firebase/app.js',
    '^firebase/auth$': '<rootDir>/__mocks__/firebase/auth.js',
    '^firebase/firestore$': '<rootDir>/__mocks__/firebase/firestore.js',
  },
};
