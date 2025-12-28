import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// Use web-specific App if it exists, otherwise use main App
let App;
if (Platform.OS === 'web') {
  try {
    App = require('./App.web').default;
    console.log('Using App.web.tsx for web platform');
  } catch (e) {
    console.log('App.web.tsx not found, using main App.tsx');
    App = require('./App').default;
  }
} else {
  App = require('./App').default;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
