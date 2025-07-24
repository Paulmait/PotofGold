#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 Generating App Store Assets...\n');

// Create assets directory structure
const assetsDirs = [
  'assets/images',
  'assets/icons',
  'assets/screenshots',
  'assets/app-store'
];

assetsDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// App icon specifications
const iconSpecs = {
  ios: [
    { size: 20, name: 'icon-20.png' },
    { size: 29, name: 'icon-29.png' },
    { size: 40, name: 'icon-40.png' },
    { size: 58, name: 'icon-58.png' },
    { size: 60, name: 'icon-60.png' },
    { size: 76, name: 'icon-76.png' },
    { size: 80, name: 'icon-80.png' },
    { size: 87, name: 'icon-87.png' },
    { size: 120, name: 'icon-120.png' },
    { size: 152, name: 'icon-152.png' },
    { size: 167, name: 'icon-167.png' },
    { size: 180, name: 'icon-180.png' },
    { size: 1024, name: 'icon-1024.png' }
  ],
  android: [
    { size: 36, name: 'icon-36.png' },
    { size: 48, name: 'icon-48.png' },
    { size: 72, name: 'icon-72.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' }
  ]
};

// Create placeholder icon files
Object.entries(iconSpecs).forEach(([platform, icons]) => {
  icons.forEach(icon => {
    const iconPath = path.join('assets/icons', icon.name);
    if (!fs.existsSync(iconPath)) {
      // Create a simple SVG placeholder
      const svgContent = `
<svg width="${icon.size}" height="${icon.size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#FFD700"/>
  <circle cx="50%" cy="50%" r="40%" fill="#FFA500"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#000" font-size="${icon.size * 0.3}">💰</text>
</svg>`;
      
      fs.writeFileSync(iconPath.replace('.png', '.svg'), svgContent);
      console.log(`✅ Created ${platform} icon: ${icon.name}`);
    }
  });
});

// Create app store screenshots
const screenshotSpecs = {
  ios: [
    { width: 1290, height: 2796, name: 'iPhone-14-Pro-Max.png' },
    { width: 1179, height: 2556, name: 'iPhone-14-Pro.png' },
    { width: 1170, height: 2532, name: 'iPhone-14.png' },
    { width: 2048, height: 2732, name: 'iPad-Pro-12-9.png' },
    { width: 1668, height: 2388, name: 'iPad-Pro-11.png' }
  ],
  android: [
    { width: 1080, height: 1920, name: 'Phone-1080x1920.png' },
    { width: 1440, height: 2560, name: 'Phone-1440x2560.png' },
    { width: 2560, height: 1600, name: 'Tablet-2560x1600.png' }
  ]
};

Object.entries(screenshotSpecs).forEach(([platform, screenshots]) => {
  screenshots.forEach(screenshot => {
    const screenshotPath = path.join('assets/screenshots', screenshot.name);
    if (!fs.existsSync(screenshotPath)) {
      // Create a simple SVG placeholder
      const svgContent = `
<svg width="${screenshot.width}" height="${screenshot.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#1a1a1a"/>
  <rect x="10%" y="10%" width="80%" height="80%" fill="#FFD700" rx="20"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#000" font-size="48">Pot of Gold</text>
  <text x="50%" y="60%" text-anchor="middle" dy=".3em" fill="#000" font-size="24">Screenshot Placeholder</text>
</svg>`;
      
      fs.writeFileSync(screenshotPath.replace('.png', '.svg'), svgContent);
      console.log(`✅ Created ${platform} screenshot: ${screenshot.name}`);
    }
  });
});

// Create app store metadata
const appStoreMetadata = {
  name: 'Pot of Gold',
  subtitle: 'Catch falling coins in this addictive mobile game!',
  description: `
🎮 Pot of Gold - The Ultimate Coin Catching Adventure!

Catch falling coins, collect power-ups, and challenge friends in this addictive mobile game! Perfect for players of all ages.

✨ FEATURES:
• Smooth touch controls for precise coin catching
• Multiple power-ups: Magnet, Double Points, Slow Motion, Gold Rush
• Challenge friends to 60-second competitive matches
• Real-time leaderboards and achievements
• Beautiful graphics and satisfying sound effects
• Watch ads to earn coins - no purchase required!

🏆 GAME MODES:
• Single Player: Endless gameplay with increasing difficulty
• Challenge Mode: 60-second competitive matches
• Multiplayer: Real-time friend challenges

💰 MONETIZATION:
• Watch rewarded ads to earn coins
• Optional in-app purchases for premium upgrades
• No pay-to-win mechanics
• Fair and balanced gameplay

🔒 PRIVACY & SAFETY:
• COPPA compliant for children under 13
• GDPR/CCPA compliant data handling
• No personal data collection from children
• Parental controls and privacy settings

🎯 PERFECT FOR:
• Casual gamers looking for quick fun
• Families with children (4+ age rating)
• Players who enjoy skill-based games
• Anyone who loves collecting and achieving goals

Download now and start your coin-catching adventure! 🪙✨
  `,
  keywords: [
    'game', 'casual', 'puzzle', 'arcade', 'coins', 'collecting',
    'family', 'kids', 'fun', 'addictive', 'challenge', 'multiplayer'
  ],
  category: 'Games',
  subcategory: 'Arcade',
  ageRating: '4+',
  contentRating: 'Everyone',
  languages: ['English'],
  price: 'Free',
  inAppPurchases: [
    'Remove Ads ($1.99)',
    'Premium Power-ups ($2.99)',
    'Coin Packages ($0.99 - $14.99)'
  ]
};

// Save metadata
const metadataPath = path.join('assets/app-store', 'metadata.json');
fs.writeFileSync(metadataPath, JSON.stringify(appStoreMetadata, null, 2));
console.log(`✅ Created app store metadata: ${metadataPath}`);

// Create privacy labels
const privacyLabels = {
  dataTypes: {
    'Contact Info': {
      used: false,
      linked: false,
      tracking: false
    },
    'Identifiers': {
      used: true,
      linked: false,
      tracking: false
    },
    'Usage Data': {
      used: true,
      linked: false,
      tracking: false
    },
    'Diagnostics': {
      used: true,
      linked: false,
      tracking: false
    }
  },
  dataUsedToTrack: [],
  dataLinkedToUser: [],
  dataNotLinkedToUser: ['Identifiers', 'Usage Data', 'Diagnostics']
};

const privacyLabelsPath = path.join('assets/app-store', 'privacy-labels.json');
fs.writeFileSync(privacyLabelsPath, JSON.stringify(privacyLabels, null, 2));
console.log(`✅ Created privacy labels: ${privacyLabelsPath}`);

console.log('\n🎉 Asset generation complete!');
console.log('\n📋 Next steps:');
console.log('1. Replace placeholder SVGs with actual PNG icons');
console.log('2. Create actual app screenshots');
console.log('3. Update metadata with final content');
console.log('4. Submit to app stores'); 