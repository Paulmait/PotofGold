#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Asset Validation Tool
 * Ensures all generated assets meet quality and compliance standards
 */

const REQUIRED_SIZES = {
  cart: {
    raster: [360, 720, 1080],
    hero: { phone: [1080, 1920], tablet: [1536, 2048] },
    thumbnail: [80, 160, 240]
  },
  trail: {
    raster: [240, 480, 720],
    hero: { phone: [1080, 1920], tablet: [1536, 2048] },
    thumbnail: [80, 160, 240]
  },
  badge: {
    raster: [120, 240, 360],
    thumbnail: [80, 160, 240]
  },
  frame: {
    raster: [400, 800, 1200],
    thumbnail: [80, 160, 240]
  }
};

const MAX_FILE_SIZES = {
  hero: 500 * 1024,      // 500KB for hero images
  raster: 200 * 1024,    // 200KB for game assets
  thumbnail: 50 * 1024,  // 50KB for thumbnails
  tile: 300 * 1024,      // 300KB for tiles
  banner: 400 * 1024     // 400KB for banners
};

class AssetValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalFiles: 0,
      validFiles: 0,
      totalSize: 0,
      skinCount: 0
    };
  }

  async validate() {
    console.log('🔍 Starting asset validation...\n');
    
    const skinsDir = path.join(__dirname, '..', 'assets', 'skins');
    
    if (!fs.existsSync(skinsDir)) {
      this.errors.push('Skins directory not found');
      this.report();
      process.exit(1);
    }

    // Load drop catalog
    const drops = this.loadDrops();
    const expectedSkins = this.getExpectedSkins(drops);
    
    // Validate each skin
    for (const skinId of expectedSkins) {
      await this.validateSkin(skinId);
    }
    
    // Check for orphaned assets
    this.checkOrphanedAssets(skinsDir, expectedSkins);
    
    // Generate report
    this.report();
  }

  loadDrops() {
    const dropsDir = path.join(__dirname, '..', 'assets', 'drops');
    const drops = [];
    
    for (let month = 1; month <= 12; month++) {
      const fileName = `month_${String(month).padStart(2, '0')}.json`;
      const filePath = path.join(dropsDir, fileName);
      
      if (fs.existsSync(filePath)) {
        const drop = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        drops.push(drop);
      }
    }
    
    return drops;
  }

  getExpectedSkins(drops) {
    const skins = new Set();
    
    drops.forEach(drop => {
      skins.add(drop.cartSkinId);
      skins.add(drop.trailId);
      skins.add(drop.badgeId);
      skins.add(drop.frameId);
    });
    
    return Array.from(skins);
  }

  async validateSkin(skinId) {
    const skinDir = path.join(__dirname, '..', 'assets', 'skins', skinId);
    
    if (!fs.existsSync(skinDir)) {
      this.errors.push(`Missing skin directory: ${skinId}`);
      return;
    }
    
    this.stats.skinCount++;
    const type = this.detectSkinType(skinId);
    
    // Validate raster assets
    this.validateRasterAssets(skinId, type);
    
    // Validate hero images (cart and trail only)
    if (type === 'cart' || type === 'trail') {
      this.validateHeroImages(skinId);
    }
    
    // Validate thumbnails
    this.validateThumbnails(skinId);
    
    // Validate marketing assets
    this.validateMarketingAssets(skinId);
  }

  detectSkinType(skinId) {
    if (skinId.startsWith('cart_')) return 'cart';
    if (skinId.startsWith('trail_')) return 'trail';
    if (skinId.startsWith('badge_')) return 'badge';
    if (skinId.startsWith('frame_')) return 'frame';
    return 'unknown';
  }

  validateRasterAssets(skinId, type) {
    const rasterDir = path.join(__dirname, '..', 'assets', 'skins', skinId, 'raster');
    
    if (!fs.existsSync(rasterDir)) {
      this.errors.push(`Missing raster directory for ${skinId}`);
      return;
    }
    
    // Check @1x
    const base = path.join(rasterDir, `${skinId}.png`);
    if (!fs.existsSync(base)) {
      this.errors.push(`Missing @1x asset: ${skinId}`);
    } else {
      this.validateFileSize(base, 'raster');
      this.stats.totalFiles++;
      this.stats.validFiles++;
    }
    
    // Check @2x
    const at2x = path.join(rasterDir, `${skinId}@2x.png`);
    if (!fs.existsSync(at2x)) {
      this.errors.push(`Missing @2x asset: ${skinId}`);
    } else {
      this.validateFileSize(at2x, 'raster');
      this.stats.totalFiles++;
      this.stats.validFiles++;
    }
    
    // Check @3x
    const at3x = path.join(rasterDir, `${skinId}@3x.png`);
    if (!fs.existsSync(at3x)) {
      this.errors.push(`Missing @3x asset: ${skinId}`);
    } else {
      this.validateFileSize(at3x, 'raster');
      this.stats.totalFiles++;
      this.stats.validFiles++;
    }
  }

  validateHeroImages(skinId) {
    const previewsDir = path.join(__dirname, '..', 'assets', 'skins', skinId, 'previews');
    
    const heroPhone = path.join(previewsDir, 'hero_phone_1080x1920.png');
    const heroTablet = path.join(previewsDir, 'hero_tablet_1536x2048.png');
    
    if (!fs.existsSync(heroPhone)) {
      this.errors.push(`Missing phone hero image: ${skinId}`);
    } else {
      this.validateFileSize(heroPhone, 'hero');
      this.stats.totalFiles++;
      this.stats.validFiles++;
    }
    
    if (!fs.existsSync(heroTablet)) {
      this.errors.push(`Missing tablet hero image: ${skinId}`);
    } else {
      this.validateFileSize(heroTablet, 'hero');
      this.stats.totalFiles++;
      this.stats.validFiles++;
    }
  }

  validateThumbnails(skinId) {
    const thumbDir = path.join(__dirname, '..', 'assets', 'skins', skinId, 'thumbnails');
    
    if (!fs.existsSync(thumbDir)) {
      this.errors.push(`Missing thumbnails directory for ${skinId}`);
      return;
    }
    
    ['thumb.png', 'thumb@2x.png', 'thumb@3x.png'].forEach(file => {
      const filePath = path.join(thumbDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing thumbnail: ${skinId}/${file}`);
      } else {
        this.validateFileSize(filePath, 'thumbnail');
        this.stats.totalFiles++;
        this.stats.validFiles++;
      }
    });
  }

  validateMarketingAssets(skinId) {
    const previewsDir = path.join(__dirname, '..', 'assets', 'skins', skinId, 'previews');
    
    const tile = path.join(previewsDir, 'tile_1024.png');
    const banner = path.join(previewsDir, 'banner_1600x900.png');
    
    if (!fs.existsSync(tile)) {
      this.warnings.push(`Missing tile asset: ${skinId}`);
    } else {
      this.validateFileSize(tile, 'tile');
      this.stats.totalFiles++;
      this.stats.validFiles++;
    }
    
    if (!fs.existsSync(banner)) {
      this.warnings.push(`Missing banner asset: ${skinId}`);
    } else {
      this.validateFileSize(banner, 'banner');
      this.stats.totalFiles++;
      this.stats.validFiles++;
    }
  }

  validateFileSize(filePath, type) {
    const stats = fs.statSync(filePath);
    const maxSize = MAX_FILE_SIZES[type] || 500 * 1024;
    
    this.stats.totalSize += stats.size;
    
    if (stats.size > maxSize) {
      this.warnings.push(
        `File too large: ${path.basename(filePath)} (${Math.round(stats.size / 1024)}KB > ${Math.round(maxSize / 1024)}KB)`
      );
    }
    
    if (stats.size === 0) {
      this.errors.push(`Empty file: ${path.basename(filePath)}`);
    }
  }

  checkOrphanedAssets(skinsDir, expectedSkins) {
    const actualSkins = fs.readdirSync(skinsDir)
      .filter(f => fs.statSync(path.join(skinsDir, f)).isDirectory())
      .filter(f => f !== 'masters'); // Exclude masters directory
    
    actualSkins.forEach(skin => {
      if (!expectedSkins.includes(skin) && skin !== 'undefined') {
        this.warnings.push(`Orphaned skin directory: ${skin}`);
      }
    });
  }

  report() {
    console.log('📊 Validation Report\n');
    console.log('='.repeat(50));
    
    // Statistics
    console.log('\n📈 Statistics:');
    console.log(`  • Total skins: ${this.stats.skinCount}`);
    console.log(`  • Total files: ${this.stats.totalFiles}`);
    console.log(`  • Valid files: ${this.stats.validFiles}`);
    console.log(`  • Total size: ${Math.round(this.stats.totalSize / 1024 / 1024)}MB`);
    
    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    if (this.errors.length === 0) {
      console.log('✅ All assets validated successfully!');
      process.exit(0);
    } else {
      console.log(`❌ Validation failed with ${this.errors.length} error(s)`);
      process.exit(1);
    }
  }
}

// Run validation
const validator = new AssetValidator();
validator.validate().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});