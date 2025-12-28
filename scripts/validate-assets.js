#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Asset requirements
const REQUIRED_ASSETS = [
  {
    file: 'pot_of_gold_icon.png',
    width: 1024,
    height: 1024,
    description: 'Main app icon (App Store/Play Store)',
  },
  {
    file: 'pot_of_gold_splash.png',
    width: 2048,
    height: 2048,
    description: 'Splash screen',
  },
  {
    file: 'adaptive-icon.png',
    width: 512,
    height: 512,
    description: 'Android adaptive icon',
  },
  {
    file: 'favicon.png',
    width: 48,
    height: 48,
    description: 'Web favicon',
  },
];

async function validateAsset(assetPath, requirements) {
  try {
    // Check if file exists
    if (!fs.existsSync(assetPath)) {
      return {
        valid: false,
        error: 'File not found',
      };
    }

    // Get file stats
    const stats = fs.statSync(assetPath);
    if (stats.size < 100) {
      return {
        valid: false,
        error: `File too small (${stats.size} bytes)`,
      };
    }

    // Check image dimensions
    const metadata = await sharp(assetPath).metadata();

    if (metadata.width !== requirements.width || metadata.height !== requirements.height) {
      return {
        valid: false,
        error: `Wrong dimensions: ${metadata.width}x${metadata.height} (expected ${requirements.width}x${requirements.height})`,
      };
    }

    if (metadata.format !== 'png') {
      return {
        valid: false,
        error: `Wrong format: ${metadata.format} (expected PNG)`,
      };
    }

    return {
      valid: true,
      info: {
        size: Math.round(stats.size / 1024) + ' KB',
        format: metadata.format.toUpperCase(),
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

async function validateAllAssets() {
  console.log('🔍 Validating Pot of Gold app assets...\n');
  console.log('='.repeat(60));

  const assetsDir = path.join(__dirname, '..', 'assets', 'images');
  let allValid = true;
  const results = [];

  for (const asset of REQUIRED_ASSETS) {
    const assetPath = path.join(assetsDir, asset.file);
    const result = await validateAsset(assetPath, asset);

    console.log(`\n📱 ${asset.description}`);
    console.log(`   File: ${asset.file}`);
    console.log(`   Required: ${asset.width}x${asset.height} PNG`);

    if (result.valid) {
      console.log(`   ✅ Status: VALID`);
      console.log(`   📊 Size: ${result.info.size}`);
      console.log(`   🎨 Format: ${result.info.format}`);
      console.log(
        `   🔧 Channels: ${result.info.channels}${result.info.hasAlpha ? ' (with alpha)' : ''}`
      );
    } else {
      console.log(`   ❌ Status: INVALID`);
      console.log(`   ⚠️  Error: ${result.error}`);
      allValid = false;
    }

    results.push({
      ...asset,
      ...result,
    });
  }

  console.log('\n' + '='.repeat(60));

  // Check app.json references
  console.log('\n📋 Checking app.json configuration...');
  const appJsonPath = path.join(__dirname, '..', 'app.json');

  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const expo = appJson.expo;

    const configChecks = [
      {
        path: expo.icon,
        expected: './assets/images/pot_of_gold_icon.png',
        field: 'icon',
      },
      {
        path: expo.splash?.image,
        expected: './assets/images/pot_of_gold_splash.png',
        field: 'splash.image',
      },
      {
        path: expo.android?.adaptiveIcon?.foregroundImage,
        expected: './assets/images/adaptive-icon.png',
        field: 'android.adaptiveIcon.foregroundImage',
      },
      {
        path: expo.web?.favicon,
        expected: './assets/images/favicon.png',
        field: 'web.favicon',
      },
    ];

    let configValid = true;
    for (const check of configChecks) {
      if (check.path === check.expected) {
        console.log(`   ✅ ${check.field}: ${check.path}`);
      } else {
        console.log(
          `   ⚠️  ${check.field}: ${check.path || 'not set'} (expected: ${check.expected})`
        );
        configValid = false;
      }
    }

    if (!configValid) {
      console.log('\n   ℹ️  Update app.json to reference the correct asset paths');
      allValid = false;
    }
  } catch (error) {
    console.log(`   ❌ Error reading app.json: ${error.message}`);
    allValid = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allValid) {
    console.log('✅ All assets are valid and properly configured!');
    console.log('\n🚀 Your app is ready for deployment!');
    console.log('\nNext steps:');
    console.log('  1. Test locally: npm start');
    console.log('  2. Build for development: eas build --profile development');
    console.log('  3. Build for production: eas build --profile production');
  } else {
    console.log('⚠️  Some assets need attention.');
    console.log('\nTo regenerate assets, run:');
    console.log('  node scripts/generate-expo-assets.js');
  }
  console.log('='.repeat(60));

  return allValid;
}

// Run validation
if (require.main === module) {
  validateAllAssets()
    .then((valid) => {
      process.exit(valid ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { validateAllAssets };
