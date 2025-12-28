#!/usr/bin/env node

/**
 * App Icon Generator
 * Generates all required app icon sizes for iOS and Android from a master image
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// iOS Icon Sizes
const iosIcons = [
  { size: 20, scale: 2, name: 'Icon-20@2x.png' },
  { size: 20, scale: 3, name: 'Icon-20@3x.png' },
  { size: 29, scale: 2, name: 'Icon-29@2x.png' },
  { size: 29, scale: 3, name: 'Icon-29@3x.png' },
  { size: 40, scale: 2, name: 'Icon-40@2x.png' },
  { size: 40, scale: 3, name: 'Icon-40@3x.png' },
  { size: 60, scale: 2, name: 'Icon-60@2x.png' },
  { size: 60, scale: 3, name: 'Icon-60@3x.png' },
  { size: 1024, scale: 1, name: 'Icon-1024.png' }, // App Store
];

// Android Icon Sizes
const androidIcons = [
  { size: 48, folder: 'mipmap-mdpi', name: 'ic_launcher.png' },
  { size: 72, folder: 'mipmap-hdpi', name: 'ic_launcher.png' },
  { size: 96, folder: 'mipmap-xhdpi', name: 'ic_launcher.png' },
  { size: 144, folder: 'mipmap-xxhdpi', name: 'ic_launcher.png' },
  { size: 192, folder: 'mipmap-xxxhdpi', name: 'ic_launcher.png' },
  { size: 512, folder: 'playstore', name: 'icon.png' }, // Play Store
];

// Adaptive Icon for Android (foreground and background)
const adaptiveIconConfig = {
  foreground: {
    size: 108,
    folders: [
      { size: 108, folder: 'mipmap-mdpi', scale: 48 / 108 },
      { size: 162, folder: 'mipmap-hdpi', scale: 72 / 108 },
      { size: 216, folder: 'mipmap-xhdpi', scale: 96 / 108 },
      { size: 324, folder: 'mipmap-xxhdpi', scale: 144 / 108 },
      { size: 432, folder: 'mipmap-xxxhdpi', scale: 192 / 108 },
    ],
  },
};

async function generateIosIcons(masterIcon) {
  console.log('🍎 Generating iOS icons...');

  const iosIconPath = path.join(__dirname, '../ios/PotOfGold/Images.xcassets/AppIcon.appiconset');

  // Create directory if it doesn't exist
  await fs.mkdir(iosIconPath, { recursive: true });

  for (const icon of iosIcons) {
    const size = icon.size * icon.scale;
    const outputPath = path.join(iosIconPath, icon.name);

    await sharp(masterIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 215, b: 0, alpha: 1 }, // Gold background
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✅ Generated ${icon.name} (${size}x${size})`);
  }

  // Generate Contents.json for Xcode
  const contents = {
    images: iosIcons.map((icon) => ({
      size: `${icon.size}x${icon.size}`,
      idiom: icon.size === 1024 ? 'ios-marketing' : 'iphone',
      filename: icon.name,
      scale: `${icon.scale}x`,
    })),
    info: {
      version: 1,
      author: 'xcode',
    },
  };

  await fs.writeFile(path.join(iosIconPath, 'Contents.json'), JSON.stringify(contents, null, 2));

  console.log('  ✅ Generated Contents.json');
}

async function generateAndroidIcons(masterIcon) {
  console.log('🤖 Generating Android icons...');

  const androidResPath = path.join(__dirname, '../android/app/src/main/res');

  for (const icon of androidIcons) {
    const iconPath = path.join(androidResPath, icon.folder);
    await fs.mkdir(iconPath, { recursive: true });

    const outputPath = path.join(iconPath, icon.name);

    await sharp(masterIcon)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 255, g: 215, b: 0, alpha: 1 }, // Gold background
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✅ Generated ${icon.folder}/${icon.name} (${icon.size}x${icon.size})`);
  }

  // Generate adaptive icon layers
  await generateAdaptiveIcons(masterIcon);
}

async function generateAdaptiveIcons(masterIcon) {
  console.log('  🎨 Generating adaptive icons...');

  const androidResPath = path.join(__dirname, '../android/app/src/main/res');

  // Generate foreground icons (with padding for safe zone)
  for (const config of adaptiveIconConfig.foreground.folders) {
    const iconPath = path.join(androidResPath, config.folder);
    await fs.mkdir(iconPath, { recursive: true });

    // Foreground with safe zone padding
    const foregroundPath = path.join(iconPath, 'ic_launcher_foreground.png');
    await sharp(masterIcon)
      .resize(Math.round(config.size * 0.66), Math.round(config.size * 0.66), {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
      })
      .extend({
        top: Math.round(config.size * 0.17),
        bottom: Math.round(config.size * 0.17),
        left: Math.round(config.size * 0.17),
        right: Math.round(config.size * 0.17),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(foregroundPath);

    // Background (solid color)
    const backgroundPath = path.join(iconPath, 'ic_launcher_background.png');
    await sharp({
      create: {
        width: config.size,
        height: config.size,
        channels: 4,
        background: { r: 255, g: 215, b: 0, alpha: 1 }, // Gold
      },
    })
      .png()
      .toFile(backgroundPath);

    console.log(`    ✅ Generated adaptive icons for ${config.folder}`);
  }
}

async function generateNotificationIcon(masterIcon) {
  console.log('🔔 Generating notification icons...');

  const androidResPath = path.join(__dirname, '../android/app/src/main/res');
  const sizes = [
    { size: 24, folder: 'drawable-mdpi' },
    { size: 36, folder: 'drawable-hdpi' },
    { size: 48, folder: 'drawable-xhdpi' },
    { size: 72, folder: 'drawable-xxhdpi' },
    { size: 96, folder: 'drawable-xxxhdpi' },
  ];

  for (const config of sizes) {
    const iconPath = path.join(androidResPath, config.folder);
    await fs.mkdir(iconPath, { recursive: true });

    const outputPath = path.join(iconPath, 'ic_notification.png');

    // Create monochrome version for notification
    await sharp(masterIcon).resize(config.size, config.size).grayscale().png().toFile(outputPath);

    console.log(
      `  ✅ Generated notification icon ${config.folder} (${config.size}x${config.size})`
    );
  }
}

async function createMasterIcon() {
  console.log('🎨 Creating master icon...');

  const masterPath = path.join(__dirname, '../assets/icon-master.png');

  // Check if master icon exists
  try {
    await fs.access(masterPath);
    return masterPath;
  } catch (error) {
    console.log('  ⚠️  Master icon not found, generating default...');

    // Generate a default icon with pot of gold
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#FFD700"/>
        <circle cx="512" cy="512" r="400" fill="#FFA500"/>
        <text x="512" y="580" font-family="Arial Black" font-size="300" text-anchor="middle" fill="#FFD700">🏺</text>
        <text x="512" y="320" font-family="Arial Black" font-size="200" text-anchor="middle" fill="#FFD700">💰</text>
      </svg>
    `;

    await sharp(Buffer.from(svg)).png().toFile(masterPath);

    console.log('  ✅ Generated default master icon');
    return masterPath;
  }
}

async function main() {
  console.log('🚀 App Icon Generator Started\n');

  try {
    // Get or create master icon
    const masterIcon = await createMasterIcon();

    // Generate iOS icons
    await generateIosIcons(masterIcon);
    console.log();

    // Generate Android icons
    await generateAndroidIcons(masterIcon);
    console.log();

    // Generate notification icons
    await generateNotificationIcon(masterIcon);
    console.log();

    console.log('✨ All app icons generated successfully!');
    console.log('\nNext steps:');
    console.log('  1. Review generated icons in ios/ and android/ directories');
    console.log('  2. Run "npx expo prebuild" to apply icons');
    console.log('  3. Test on simulators/devices');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateIosIcons, generateAndroidIcons };
