#!/usr/bin/env node

/**
 * Screenshot Generator for App Store & Play Store
 * Generates marketing screenshots with device frames
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Screenshot configurations for different devices
const screenshotConfigs = {
  ios: [
    { name: 'iphone_67', width: 1290, height: 2796, deviceName: 'iPhone 15 Pro Max' },
    { name: 'iphone_65', width: 1284, height: 2778, deviceName: 'iPhone 14 Plus' },
    { name: 'iphone_55', width: 1242, height: 2208, deviceName: 'iPhone 8 Plus' },
    { name: 'ipad_129', width: 2048, height: 2732, deviceName: 'iPad Pro 12.9"' },
    { name: 'ipad_105', width: 1668, height: 2224, deviceName: 'iPad Air' },
  ],
  android: [
    { name: 'phone', width: 1080, height: 1920, deviceName: 'Pixel 7' },
    { name: 'tablet_7', width: 1200, height: 1920, deviceName: '7" Tablet' },
    { name: 'tablet_10', width: 1600, height: 2560, deviceName: '10" Tablet' },
  ],
};

// Marketing text overlays for screenshots
const marketingTexts = [
  {
    title: 'Catch the Gold!',
    subtitle: 'Swipe to collect coins',
    features: ['Simple controls', 'Addictive gameplay', 'Endless fun'],
  },
  {
    title: 'Unlock Treasures',
    subtitle: '50+ unique skins to collect',
    features: ['State-themed skins', 'Rare collectibles', 'Daily rewards'],
  },
  {
    title: 'Challenge Friends',
    subtitle: 'Compete for high scores',
    features: ['Global leaderboard', 'Weekly tournaments', 'Social sharing'],
  },
  {
    title: 'Power-Ups Galore',
    subtitle: 'Boost your gameplay',
    features: ['Magnet power', 'Speed boost', 'Score multiplier'],
  },
  {
    title: 'Gold Vault Club',
    subtitle: 'Premium membership',
    features: ['Exclusive skins', 'Daily bonuses', 'Ad-free experience'],
  },
];

async function generateScreenshotBase(config, bgColor = '#FFD700') {
  // Create base screenshot with gradient background
  const svg = `
    <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
        </linearGradient>
        <pattern id="pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="50" cy="50" r="2" fill="#FFFFFF" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="${config.width}" height="${config.height}" fill="url(#bg)"/>
      <rect width="${config.width}" height="${config.height}" fill="url(#pattern)"/>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png();
}

async function addGameplayMockup(base, config) {
  // Add a mockup of the game screen
  const gameWidth = Math.round(config.width * 0.8);
  const gameHeight = Math.round(config.height * 0.5);
  const gameTop = Math.round(config.height * 0.35);
  const gameLeft = Math.round((config.width - gameWidth) / 2);

  const gameSvg = `
    <svg width="${gameWidth}" height="${gameHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${gameWidth}" height="${gameHeight}" fill="#87CEEB" rx="20"/>
      <!-- Game elements -->
      <text x="${gameWidth / 2}" y="${gameHeight / 3}" font-size="${gameHeight / 10}" text-anchor="middle" fill="#FFD700">
        🏺 Score: 12,345
      </text>
      <!-- Falling coins -->
      <text x="${gameWidth * 0.2}" y="${gameHeight * 0.5}" font-size="${gameHeight / 15}">🪙</text>
      <text x="${gameWidth * 0.4}" y="${gameHeight * 0.6}" font-size="${gameHeight / 15}">🪙</text>
      <text x="${gameWidth * 0.6}" y="${gameHeight * 0.4}" font-size="${gameHeight / 15}">🪙</text>
      <text x="${gameWidth * 0.8}" y="${gameHeight * 0.7}" font-size="${gameHeight / 15}">🪙</text>
      <!-- Pot at bottom -->
      <text x="${gameWidth / 2}" y="${gameHeight * 0.9}" font-size="${gameHeight / 8}" text-anchor="middle">🏺</text>
    </svg>
  `;

  const gameElement = await sharp(Buffer.from(gameSvg)).png().toBuffer();

  return base.composite([
    {
      input: gameElement,
      top: gameTop,
      left: gameLeft,
    },
  ]);
}

async function addMarketingText(base, config, textData, index) {
  const titleSize = Math.round(config.height / 20);
  const subtitleSize = Math.round(config.height / 30);
  const featureSize = Math.round(config.height / 40);

  const textSvg = `
    <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Title -->
      <text x="${config.width / 2}" y="${config.height * 0.1}" 
            font-family="Arial Black" font-size="${titleSize}" 
            text-anchor="middle" fill="#FFFFFF" stroke="#000000" stroke-width="2">
        ${textData.title}
      </text>
      
      <!-- Subtitle -->
      <text x="${config.width / 2}" y="${config.height * 0.15}" 
            font-family="Arial" font-size="${subtitleSize}" 
            text-anchor="middle" fill="#FFFFFF">
        ${textData.subtitle}
      </text>
      
      <!-- Features -->
      ${textData.features
        .map(
          (feature, i) => `
        <text x="${config.width / 2}" y="${config.height * (0.88 + i * 0.03)}" 
              font-family="Arial" font-size="${featureSize}" 
              text-anchor="middle" fill="#FFFFFF">
          ✨ ${feature}
        </text>
      `
        )
        .join('')}
      
      <!-- Screenshot number -->
      <text x="${config.width * 0.95}" y="${config.height * 0.98}" 
            font-family="Arial" font-size="${featureSize * 0.8}" 
            text-anchor="end" fill="#FFFFFF" opacity="0.5">
        ${index + 1}/${marketingTexts.length}
      </text>
    </svg>
  `;

  const textOverlay = await sharp(Buffer.from(textSvg)).png().toBuffer();

  return base.composite([
    {
      input: textOverlay,
      top: 0,
      left: 0,
    },
  ]);
}

async function addDeviceFrame(screenshot, deviceType) {
  // Add device frame around screenshot
  const frameWidth = screenshot.width + 100;
  const frameHeight = screenshot.height + 200;

  const frameSvg = `
    <svg width="${frameWidth}" height="${frameHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="75" width="${screenshot.width + 50}" height="${screenshot.height + 50}" 
            fill="none" stroke="#333333" stroke-width="10" rx="30"/>
      <circle cx="${frameWidth / 2}" cy="${frameHeight - 50}" r="25" fill="#333333"/>
    </svg>
  `;

  // This would be enhanced with actual device frame images in production
  return screenshot;
}

async function generateScreenshotSet(platform, config) {
  console.log(`  📱 Generating ${config.deviceName} screenshots...`);

  const outputDir = path.join(__dirname, `../marketing/screenshots/${platform}/${config.name}`);
  await fs.mkdir(outputDir, { recursive: true });

  for (let i = 0; i < marketingTexts.length; i++) {
    // Generate base screenshot
    let screenshot = await generateScreenshotBase(config);

    // Add gameplay mockup
    screenshot = await addGameplayMockup(screenshot, config);

    // Add marketing text
    screenshot = await addMarketingText(screenshot, config, marketingTexts[i], i);

    // Save screenshot
    const filename = `screenshot_${i + 1}.png`;
    const outputPath = path.join(outputDir, filename);

    await screenshot.toFile(outputPath);
    console.log(`    ✅ Generated ${filename}`);
  }
}

async function generateFeatureGraphic() {
  console.log('🎨 Generating feature graphic for Play Store...');

  const width = 1024;
  const height = 500;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- Logo/Icon -->
      <text x="200" y="250" font-size="150" text-anchor="middle">🏺</text>
      <text x="200" y="150" font-size="100" text-anchor="middle">💰</text>
      
      <!-- Title -->
      <text x="600" y="200" font-family="Arial Black" font-size="80" fill="#FFFFFF" stroke="#000000" stroke-width="2">
        Pot of Gold
      </text>
      
      <!-- Tagline -->
      <text x="600" y="280" font-family="Arial" font-size="40" fill="#FFFFFF">
        Catch coins, unlock treasures!
      </text>
      
      <!-- Call to action -->
      <rect x="500" y="350" width="200" height="60" fill="#4CAF50" rx="30"/>
      <text x="600" y="390" font-family="Arial Bold" font-size="30" text-anchor="middle" fill="#FFFFFF">
        PLAY FREE
      </text>
    </svg>
  `;

  const outputDir = path.join(__dirname, '../marketing/feature-graphic');
  await fs.mkdir(outputDir, { recursive: true });

  await sharp(Buffer.from(svg)).png().toFile(path.join(outputDir, 'feature-graphic.png'));

  console.log('  ✅ Generated feature-graphic.png (1024x500)');
}

async function generateAppPreview() {
  console.log('🎬 Generating app preview storyboard...');

  const storyboard = [
    {
      scene: 'Title Screen',
      duration: '2s',
      description: 'Logo animation with gold coins falling',
    },
    { scene: 'Gameplay', duration: '5s', description: 'Player catching coins with pot' },
    { scene: 'Power-up', duration: '3s', description: 'Magnet power-up attracting coins' },
    { scene: 'Shop', duration: '3s', description: 'Browsing and unlocking new skins' },
    { scene: 'Leaderboard', duration: '2s', description: 'High score celebration' },
    { scene: 'Call to Action', duration: '2s', description: 'Download now text with app icon' },
  ];

  const outputDir = path.join(__dirname, '../marketing/app-preview');
  await fs.mkdir(outputDir, { recursive: true });

  const storyboardContent = `# App Preview Video Storyboard (30 seconds max)

## Video Specifications:
- iOS: 1920x886 (landscape) or 886x1920 (portrait)
- Android: 16:9 or 9:16 aspect ratio
- Duration: 15-30 seconds
- Format: MP4, H.264

## Storyboard:
${storyboard
  .map(
    (scene, i) => `
### Scene ${i + 1}: ${scene.scene} (${scene.duration})
- **Description**: ${scene.description}
- **Key Message**: Show core gameplay/feature
- **Transition**: Smooth fade/slide to next scene
`
  )
  .join('')}

## Audio:
- Background Music: Upbeat, cheerful tune
- Sound Effects: Coin collection sounds, power-up activation
- No voice-over needed (use text overlays)

## Recording Instructions:
1. Use QuickTime (Mac) or OBS Studio to record gameplay
2. Edit in iMovie/Final Cut Pro (iOS) or DaVinci Resolve (cross-platform)
3. Export at highest quality, then compress for store requirements
`;

  await fs.writeFile(path.join(outputDir, 'storyboard.md'), storyboardContent);

  console.log('  ✅ Generated app preview storyboard');
}

async function main() {
  console.log('📸 Screenshot Generator Started\n');

  try {
    // Generate iOS screenshots
    console.log('🍎 Generating iOS screenshots...');
    for (const config of screenshotConfigs.ios) {
      await generateScreenshotSet('ios', config);
    }
    console.log();

    // Generate Android screenshots
    console.log('🤖 Generating Android screenshots...');
    for (const config of screenshotConfigs.android) {
      await generateScreenshotSet('android', config);
    }
    console.log();

    // Generate feature graphic for Play Store
    await generateFeatureGraphic();
    console.log();

    // Generate app preview storyboard
    await generateAppPreview();
    console.log();

    console.log('✨ All marketing assets generated successfully!');
    console.log('\n📁 Assets location: ./marketing/');
    console.log('\nNext steps:');
    console.log('  1. Review and customize generated screenshots');
    console.log('  2. Replace mockups with actual gameplay screenshots');
    console.log('  3. Record app preview video following storyboard');
    console.log('  4. Upload to App Store Connect and Play Console');
  } catch (error) {
    console.error('❌ Error generating screenshots:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateScreenshotSet, generateFeatureGraphic };
