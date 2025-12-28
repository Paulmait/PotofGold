// Asset and environment validation script for Pot of Gold
const fs = require('fs');
const path = require('path');

const requiredAssets = [
  './assets/images/pot_of_gold_icon.png',
  './assets/images/pot_of_gold_splash.png',
  './assets/images/adaptive-icon.png',
  './assets/images/favicon.png',
];

const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'ADMIN_PIN',
  'ADMIN_RECOVERY_EMAIL',
];

let missingAssets = requiredAssets.filter(
  (asset) => !fs.existsSync(path.resolve(__dirname, '..', asset))
);
let missingEnv = requiredEnvVars.filter((key) => !process.env[key]);

if (missingAssets.length > 0) {
  console.error('Missing required assets:', missingAssets);
  process.exit(1);
}
if (missingEnv.length > 0) {
  console.error('Missing required environment variables:', missingEnv);
  process.exit(1);
}
console.log('All required assets and environment variables are present.');
