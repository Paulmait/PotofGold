#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Colors for the Pot of Gold theme
const COLORS = {
  gold: '#FFD700',
  darkGold: '#FFA500',
  brown: '#8B4513',
  darkBrown: '#654321',
  green: '#228B22',
  lightGreen: '#90EE90'
};

// Draw a pot of gold
function drawPotOfGold(ctx, width, height, includeTitle = false) {
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 1024;

  // Clear canvas with gradient background
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width / 2);
  gradient.addColorStop(0, COLORS.lightGreen);
  gradient.addColorStop(1, COLORS.green);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw rainbow arc
  const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
  const rainbowRadius = 350 * scale;
  const rainbowWidth = 30 * scale;
  
  rainbowColors.forEach((color, index) => {
    ctx.beginPath();
    ctx.arc(centerX, centerY + 100 * scale, rainbowRadius - (index * rainbowWidth), Math.PI, 0, true);
    ctx.strokeStyle = color;
    ctx.lineWidth = rainbowWidth;
    ctx.stroke();
  });

  // Draw pot body
  ctx.fillStyle = COLORS.brown;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + 100 * scale, 250 * scale, 300 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw pot rim
  ctx.fillStyle = COLORS.darkBrown;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - 50 * scale, 280 * scale, 80 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw pot highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(centerX - 100 * scale, centerY, 80 * scale, 150 * scale, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Draw gold coins overflowing
  const coinPositions = [
    { x: 0, y: -100 },
    { x: -80, y: -120 },
    { x: 80, y: -120 },
    { x: -40, y: -140 },
    { x: 40, y: -140 },
    { x: 0, y: -160 },
    { x: -120, y: -80 },
    { x: 120, y: -80 }
  ];

  coinPositions.forEach(pos => {
    // Coin shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      centerX + (pos.x + 5) * scale,
      centerY + (pos.y + 5) * scale,
      40 * scale,
      35 * scale,
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Coin body
    const coinGradient = ctx.createRadialGradient(
      centerX + pos.x * scale,
      centerY + pos.y * scale,
      0,
      centerX + pos.x * scale,
      centerY + pos.y * scale,
      40 * scale
    );
    coinGradient.addColorStop(0, COLORS.gold);
    coinGradient.addColorStop(1, COLORS.darkGold);
    ctx.fillStyle = coinGradient;
    ctx.beginPath();
    ctx.ellipse(
      centerX + pos.x * scale,
      centerY + pos.y * scale,
      40 * scale,
      35 * scale,
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Coin shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(
      centerX + (pos.x - 10) * scale,
      centerY + (pos.y - 10) * scale,
      15 * scale,
      12 * scale,
      0, 0, Math.PI * 2
    );
    ctx.fill();

    // Dollar sign on coins
    ctx.fillStyle = COLORS.darkGold;
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', centerX + pos.x * scale, centerY + pos.y * scale);
  });

  // Draw sparkles
  const sparklePositions = [
    { x: -150, y: -150 },
    { x: 150, y: -150 },
    { x: -200, y: 0 },
    { x: 200, y: 0 },
    { x: 0, y: -200 }
  ];

  sparklePositions.forEach(pos => {
    drawSparkle(ctx, centerX + pos.x * scale, centerY + pos.y * scale, 20 * scale);
  });

  // Add game title for splash screens
  if (includeTitle && width >= 1024) {
    // Title shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = `bold ${120 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('POT OF', centerX + 3, centerY + 350 * scale + 3);
    ctx.fillText('GOLD', centerX + 3, centerY + 450 * scale + 3);

    // Title text with gradient
    const textGradient = ctx.createLinearGradient(0, centerY + 300 * scale, 0, centerY + 500 * scale);
    textGradient.addColorStop(0, COLORS.gold);
    textGradient.addColorStop(1, COLORS.darkGold);
    ctx.fillStyle = textGradient;
    ctx.fillText('POT OF', centerX, centerY + 350 * scale);
    ctx.fillText('GOLD', centerX, centerY + 450 * scale);
  }
}

// Draw a sparkle effect
function drawSparkle(ctx, x, y, size) {
  ctx.save();
  ctx.fillStyle = COLORS.gold;
  ctx.translate(x, y);
  
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.lineTo(size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

// Generate app icon (1024x1024)
function generateAppIcon() {
  console.log('Generating app icon...');
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  drawPotOfGold(ctx, 1024, 1024, false);
  return canvas;
}

// Generate splash screen (2048x2048)
function generateSplashScreen() {
  console.log('Generating splash screen...');
  const canvas = createCanvas(2048, 2048);
  const ctx = canvas.getContext('2d');
  drawPotOfGold(ctx, 2048, 2048, true);
  return canvas;
}

// Generate adaptive icon (512x512)
function generateAdaptiveIcon() {
  console.log('Generating adaptive icon...');
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  drawPotOfGold(ctx, 512, 512, false);
  return canvas;
}

// Generate favicon (48x48)
function generateFavicon() {
  console.log('Generating favicon...');
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  
  // Simple gold background with pot icon
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(0, 0, 48, 48);
  
  // Draw mini pot
  ctx.fillStyle = COLORS.brown;
  ctx.beginPath();
  ctx.ellipse(24, 28, 15, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw mini coins
  ctx.fillStyle = COLORS.darkGold;
  ctx.beginPath();
  ctx.arc(24, 18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(18, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(30, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

// Main function
function main() {
  try {
    const assetsDir = path.join(__dirname, '..', 'assets', 'images');
    
    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Generate all assets
    const appIcon = generateAppIcon();
    const splashScreen = generateSplashScreen();
    const adaptiveIcon = generateAdaptiveIcon();
    const favicon = generateFavicon();
    
    // Save assets as PNG files
    fs.writeFileSync(path.join(assetsDir, 'pot_of_gold_icon.png'), appIcon.toBuffer('image/png'));
    fs.writeFileSync(path.join(assetsDir, 'pot_of_gold_splash.png'), splashScreen.toBuffer('image/png'));
    fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveIcon.toBuffer('image/png'));
    fs.writeFileSync(path.join(assetsDir, 'favicon.png'), favicon.toBuffer('image/png'));
    
    console.log('✅ All app assets generated successfully!');
    console.log('📱 Assets saved to assets/images/ directory');
    
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateAppIcon, generateSplashScreen, generateAdaptiveIcon, generateFavicon }; 