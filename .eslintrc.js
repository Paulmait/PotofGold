module.exports = {
  root: true,
  extends: ['expo', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  rules: {
    // Disable rules not available in installed version
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-wrapper-object-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-no-undef': 'off',
    'react-hooks/rules-of-hooks': 'off',

    // React Native rules
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/no-raw-text': 'off',

    // General rules
    'no-console': 'off',
    'no-debugger': 'error',
    'prefer-const': 'off',
    'no-var': 'off',
    'object-shorthand': 'off',
    'prefer-template': 'off',

    // Import rules
    'import/no-unresolved': 'off',
    'import/namespace': 'off',
    'import/export': 'off',
    // App Store compliance
    'no-alert': 'off',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'off',
    'no-script-url': 'error',
  },
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    '*.config.js',
    '*.config.ts',
    'metro.config.js',
    'babel.config.js',
    'jest.config.js',
    'jest.setup.js',
    'web/',
    'web-build/',
    'android/',
    'ios/',
    'scripts/',
    '*.old.js',
    'marketing/',
    'functions/',
    '__tests__/',
  ],
};
