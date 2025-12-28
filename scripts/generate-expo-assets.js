#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Asset configurations
const ASSETS = {
  icon: {
    size: 1024,
    name: 'pot_of_gold_icon.png',
    description: 'Main app icon',
  },
  splash: {
    width: 2048,
    height: 2048,
    name: 'pot_of_gold_splash.png',
    description: 'Splash screen',
  },
  adaptiveIcon: {
    size: 512,
    name: 'adaptive-icon.png',
    description: 'Android adaptive icon',
  },
  favicon: {
    size: 48,
    name: 'favicon.png',
    description: 'Web favicon',
  },
};

// Colors for the Pot of Gold theme
const COLORS = {
  gold: { r: 255, g: 215, b: 0 }, // #FFD700
  darkGold: { r: 255, g: 165, b: 0 }, // #FFA500
  brown: { r: 139, g: 69, b: 19 }, // #8B4513
  green: { r: 34, g: 139, b: 34 }, // #228B22
  lightGreen: { r: 144, g: 238, b: 144 }, // #90EE90
};

// Create SVG for Pot of Gold icon
function createPotOfGoldSVG(width, height, includeTitle = false) {
  const scale = Math.min(width, height) / 1024;
  const centerX = width / 2;
  const centerY = height / 2;

  let svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background gradient -->
    <radialGradient id="bgGradient">
      <stop offset="0%" style="stop-color:#90EE90"/>
      <stop offset="100%" style="stop-color:#228B22"/>
    </radialGradient>
    
    <!-- Gold gradient -->
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="100%" style="stop-color:#FFA500"/>
    </linearGradient>
    
    <!-- Pot gradient -->
    <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B4513"/>
      <stop offset="50%" style="stop-color:#A0522D"/>
      <stop offset="100%" style="stop-color:#654321"/>
    </linearGradient>
    
    <!-- Coin shine -->
    <radialGradient id="coinShine">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1"/>
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- Rainbow arc -->`;

  // Rainbow colors
  const rainbowColors = [
    '#FF0000',
    '#FF7F00',
    '#FFFF00',
    '#00FF00',
    '#0000FF',
    '#4B0082',
    '#9400D3',
  ];
  const rainbowRadius = 350 * scale;
  const rainbowWidth = 30 * scale;

  rainbowColors.forEach((color, index) => {
    const radius = rainbowRadius - index * rainbowWidth;
    svg += `
  <path d="M ${centerX - radius} ${centerY + 100 * scale} 
           A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY + 100 * scale}"
        fill="none" stroke="${color}" stroke-width="${rainbowWidth}"/>`;
  });

  // Pot body
  svg += `
  
  <!-- Pot shadow -->
  <ellipse cx="${centerX + 10 * scale}" cy="${centerY + 110 * scale}" 
           rx="${250 * scale}" ry="${300 * scale}" 
           fill="rgba(0,0,0,0.3)"/>
  
  <!-- Pot body -->
  <ellipse cx="${centerX}" cy="${centerY + 100 * scale}" 
           rx="${250 * scale}" ry="${300 * scale}" 
           fill="url(#potGradient)"/>
  
  <!-- Pot rim -->
  <ellipse cx="${centerX}" cy="${centerY - 50 * scale}" 
           rx="${280 * scale}" ry="${80 * scale}" 
           fill="#654321"/>
  
  <!-- Pot rim highlight -->
  <ellipse cx="${centerX}" cy="${centerY - 60 * scale}" 
           rx="${260 * scale}" ry="${60 * scale}" 
           fill="#8B4513"/>
  
  <!-- Pot highlight -->
  <ellipse cx="${centerX - 100 * scale}" cy="${centerY}" 
           rx="${80 * scale}" ry="${150 * scale}" 
           fill="rgba(255,255,255,0.2)" transform="rotate(-15 ${centerX} ${centerY})"/>`;

  // Gold coins
  const coinPositions = [
    { x: 0, y: -100 },
    { x: -80, y: -120 },
    { x: 80, y: -120 },
    { x: -40, y: -140 },
    { x: 40, y: -140 },
    { x: 0, y: -160 },
    { x: -120, y: -80 },
    { x: 120, y: -80 },
    { x: -60, y: -100 },
    { x: 60, y: -100 },
  ];

  coinPositions.forEach((pos, index) => {
    const coinX = centerX + pos.x * scale;
    const coinY = centerY + pos.y * scale;
    const coinRadius = 35 * scale;

    svg += `
  <!-- Coin ${index + 1} -->
  <ellipse cx="${coinX + 3 * scale}" cy="${coinY + 3 * scale}" 
           rx="${coinRadius}" ry="${coinRadius * 0.9}" 
           fill="rgba(0,0,0,0.3)"/>
  <ellipse cx="${coinX}" cy="${coinY}" 
           rx="${coinRadius}" ry="${coinRadius * 0.9}" 
           fill="url(#coinShine)"/>
  <ellipse cx="${coinX - 10 * scale}" cy="${coinY - 10 * scale}" 
           rx="${coinRadius * 0.3}" ry="${coinRadius * 0.25}" 
           fill="rgba(255,255,255,0.6)"/>
  <text x="${coinX}" y="${coinY + 5 * scale}" 
        font-family="Arial Black" font-size="${24 * scale}px" 
        text-anchor="middle" fill="#B8860B">$</text>`;
  });

  // Sparkle effects
  const sparklePositions = [
    { x: -150, y: -150 },
    { x: 150, y: -150 },
    { x: -200, y: 0 },
    { x: 200, y: 0 },
    { x: 0, y: -200 },
  ];

  sparklePositions.forEach((pos) => {
    const sparkleX = centerX + pos.x * scale;
    const sparkleY = centerY + pos.y * scale;
    const size = 20 * scale;

    svg += `
  <!-- Sparkle -->
  <g transform="translate(${sparkleX}, ${sparkleY})">
    <path d="M 0,-${size} L ${size / 3},0 L 0,${size} L -${size / 3},0 Z" fill="#FFD700" opacity="0.8"/>
    <path d="M -${size},0 L 0,-${size / 3} L ${size},0 L 0,${size / 3} Z" fill="#FFD700" opacity="0.8"/>
  </g>`;
  });

  // Add title for splash screen
  if (includeTitle && width >= 1024) {
    svg += `
  
  <!-- Title shadow -->
  <text x="${centerX + 3}" y="${centerY + 350 * scale + 3}" 
        font-family="Arial Black" font-size="${120 * scale}px" 
        text-anchor="middle" fill="rgba(0,0,0,0.5)">POT OF</text>
  <text x="${centerX + 3}" y="${centerY + 450 * scale + 3}" 
        font-family="Arial Black" font-size="${120 * scale}px" 
        text-anchor="middle" fill="rgba(0,0,0,0.5)">GOLD</text>
  
  <!-- Title -->
  <text x="${centerX}" y="${centerY + 350 * scale}" 
        font-family="Arial Black" font-size="${120 * scale}px" 
        text-anchor="middle" fill="url(#goldGradient)">POT OF</text>
  <text x="${centerX}" y="${centerY + 450 * scale}" 
        font-family="Arial Black" font-size="${120 * scale}px" 
        text-anchor="middle" fill="url(#goldGradient)">GOLD</text>`;
  }

  svg += `
</svg>`;

  return svg;
}

// Generate an image from SVG
async function generateImage(svgContent, outputPath) {
  try {
    await sharp(Buffer.from(svgContent)).png().toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Error generating ${outputPath}:`, error.message);
    return false;
  }
}

// Main function to generate all assets
async function generateAllAssets() {
  console.log('🎨 Starting Pot of Gold asset generation...\n');

  const assetsDir = path.join(__dirname, '..', 'assets', 'images');

  // Ensure directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  // Generate main app icon
  console.log(`📱 Generating ${ASSETS.icon.description}...`);
  const iconSVG = createPotOfGoldSVG(ASSETS.icon.size, ASSETS.icon.size, false);
  if (await generateImage(iconSVG, path.join(assetsDir, ASSETS.icon.name))) {
    console.log(`  ✅ ${ASSETS.icon.name} (${ASSETS.icon.size}x${ASSETS.icon.size})`);
    successCount++;
  } else {
    console.log(`  ❌ Failed to generate ${ASSETS.icon.name}`);
    failCount++;
  }

  // Generate splash screen
  console.log(`\n🎨 Generating ${ASSETS.splash.description}...`);
  const splashSVG = createPotOfGoldSVG(ASSETS.splash.width, ASSETS.splash.height, true);
  if (await generateImage(splashSVG, path.join(assetsDir, ASSETS.splash.name))) {
    console.log(`  ✅ ${ASSETS.splash.name} (${ASSETS.splash.width}x${ASSETS.splash.height})`);
    successCount++;
  } else {
    console.log(`  ❌ Failed to generate ${ASSETS.splash.name}`);
    failCount++;
  }

  // Generate adaptive icon
  console.log(`\n🤖 Generating ${ASSETS.adaptiveIcon.description}...`);
  const adaptiveSVG = createPotOfGoldSVG(ASSETS.adaptiveIcon.size, ASSETS.adaptiveIcon.size, false);
  if (await generateImage(adaptiveSVG, path.join(assetsDir, ASSETS.adaptiveIcon.name))) {
    console.log(
      `  ✅ ${ASSETS.adaptiveIcon.name} (${ASSETS.adaptiveIcon.size}x${ASSETS.adaptiveIcon.size})`
    );
    successCount++;
  } else {
    console.log(`  ❌ Failed to generate ${ASSETS.adaptiveIcon.name}`);
    failCount++;
  }

  // Generate favicon
  console.log(`\n🌐 Generating ${ASSETS.favicon.description}...`);
  const faviconSVG = `
<svg width="${ASSETS.favicon.size}" height="${ASSETS.favicon.size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${ASSETS.favicon.size}" height="${ASSETS.favicon.size}" fill="#FFD700"/>
  <circle cx="24" cy="28" r="12" fill="#8B4513"/>
  <circle cx="24" cy="20" r="8" fill="#FFA500"/>
  <circle cx="20" cy="18" r="5" fill="#FFD700"/>
  <circle cx="28" cy="18" r="5" fill="#FFD700"/>
  <text x="24" y="30" font-family="Arial" font-size="14" text-anchor="middle" fill="#654321">$</text>
</svg>`;

  if (await generateImage(faviconSVG, path.join(assetsDir, ASSETS.favicon.name))) {
    console.log(`  ✅ ${ASSETS.favicon.name} (${ASSETS.favicon.size}x${ASSETS.favicon.size})`);
    successCount++;
  } else {
    console.log(`  ❌ Failed to generate ${ASSETS.favicon.name}`);
    failCount++;
  }

  // Create metadata file
  const metadata = {
    generated: new Date().toISOString(),
    generator: 'generate-expo-assets.js',
    theme: 'Pot of Gold',
    colors: {
      gold: '#FFD700',
      darkGold: '#FFA500',
      brown: '#8B4513',
      green: '#228B22',
      lightGreen: '#90EE90',
    },
    assets: Object.entries(ASSETS).map(([key, config]) => ({
      type: key,
      filename: config.name,
      size: config.size || `${config.width}x${config.height}`,
      description: config.description,
    })),
    totalAssets: successCount,
  };

  fs.writeFileSync(
    path.join(assetsDir, 'expo-assets-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Asset generation complete!');
  console.log(`📊 Successfully generated: ${successCount} assets`);
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount} assets`);
  }
  console.log('📁 Assets location: assets/images/');
  console.log('📝 Metadata saved to: expo-assets-metadata.json');
  console.log('='.repeat(50));

  if (successCount === Object.keys(ASSETS).length) {
    console.log('\n✅ All assets generated successfully!');
    console.log('\nNext steps:');
    console.log('  1. Review the generated assets in assets/images/');
    console.log('  2. Test the app with: npm start');
    console.log('  3. Build for production when ready');
  }
}

// Check if sharp is available
function checkDependencies() {
  try {
    require('sharp');
    return true;
  } catch (error) {
    console.error('❌ Error: sharp module not found.');
    console.log('\n📦 Please install sharp first:');
    console.log('   npm install sharp\n');
    return false;
  }
}

// Run the generator
if (require.main === module) {
  if (checkDependencies()) {
    generateAllAssets().catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

module.exports = { generateAllAssets, createPotOfGoldSVG };
