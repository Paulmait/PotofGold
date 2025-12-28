#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Asset Manifest Generator
 * Creates a comprehensive manifest of all game assets for efficient loading
 */

class ManifestGenerator {
  constructor() {
    this.manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      totalSkins: 0,
      totalFiles: 0,
      totalSize: 0,
      skins: {},
      drops: {},
      checksums: {},
    };
  }

  async generate() {
    // Process all skins
    await this.processSkins();

    // Process drops
    await this.processDrops();

    // Generate checksums
    await this.generateChecksums();

    // Output manifest
    console.log(JSON.stringify(this.manifest, null, 2));
  }

  async processSkins() {
    const skinsDir = path.join(__dirname, '..', 'assets', 'skins');

    if (!fs.existsSync(skinsDir)) {
      throw new Error('Skins directory not found');
    }

    const skinDirs = fs
      .readdirSync(skinsDir)
      .filter((f) => fs.statSync(path.join(skinsDir, f)).isDirectory())
      .filter((f) => f !== 'masters' && f !== 'undefined');

    for (const skinId of skinDirs) {
      const skinData = await this.processSkin(skinId);
      if (skinData) {
        this.manifest.skins[skinId] = skinData;
        this.manifest.totalSkins++;
      }
    }
  }

  async processSkin(skinId) {
    const skinDir = path.join(__dirname, '..', 'assets', 'skins', skinId);

    const skinData = {
      id: skinId,
      type: this.detectSkinType(skinId),
      assets: {
        raster: {},
        previews: {},
        thumbnails: {},
      },
      size: 0,
      fileCount: 0,
    };

    // Process raster assets
    const rasterDir = path.join(skinDir, 'raster');
    if (fs.existsSync(rasterDir)) {
      skinData.assets.raster = this.processDirectory(rasterDir, skinId);
    }

    // Process previews
    const previewsDir = path.join(skinDir, 'previews');
    if (fs.existsSync(previewsDir)) {
      skinData.assets.previews = this.processDirectory(previewsDir, skinId);
    }

    // Process thumbnails
    const thumbsDir = path.join(skinDir, 'thumbnails');
    if (fs.existsSync(thumbsDir)) {
      skinData.assets.thumbnails = this.processDirectory(thumbsDir, skinId);
    }

    // Calculate totals
    Object.values(skinData.assets).forEach((category) => {
      Object.values(category).forEach((file) => {
        skinData.size += file.size;
        skinData.fileCount++;
        this.manifest.totalFiles++;
        this.manifest.totalSize += file.size;
      });
    });

    return skinData;
  }

  processDirectory(dirPath, skinId) {
    const files = {};
    const dirFiles = fs.readdirSync(dirPath);

    dirFiles.forEach((fileName) => {
      const filePath = path.join(dirPath, fileName);
      const stats = fs.statSync(filePath);

      if (stats.isFile() && fileName.endsWith('.png')) {
        const fileData = {
          path: path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/'),
          size: stats.size,
          modified: stats.mtime.toISOString(),
          checksum: this.generateFileChecksum(filePath),
        };

        // Detect resolution variant
        if (fileName.includes('@2x')) {
          fileData.resolution = '2x';
        } else if (fileName.includes('@3x')) {
          fileData.resolution = '3x';
        } else {
          fileData.resolution = '1x';
        }

        // Detect asset variant
        if (fileName.includes('hero_phone')) {
          fileData.variant = 'hero_phone';
        } else if (fileName.includes('hero_tablet')) {
          fileData.variant = 'hero_tablet';
        } else if (fileName.includes('tile')) {
          fileData.variant = 'tile';
        } else if (fileName.includes('banner')) {
          fileData.variant = 'banner';
        } else if (fileName.includes('thumb')) {
          fileData.variant = 'thumbnail';
        } else {
          fileData.variant = 'standard';
        }

        files[fileName] = fileData;
      }
    });

    return files;
  }

  async processDrops() {
    const dropsDir = path.join(__dirname, '..', 'assets', 'drops');

    for (let month = 1; month <= 12; month++) {
      const fileName = `month_${String(month).padStart(2, '0')}.json`;
      const filePath = path.join(dropsDir, fileName);

      if (fs.existsSync(filePath)) {
        const dropData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        this.manifest.drops[dropData.id] = {
          id: dropData.id,
          month: dropData.month,
          monthLabel: dropData.monthLabel,
          items: {
            cart: dropData.cartSkinId,
            trail: dropData.trailId,
            badge: dropData.badgeId,
            frame: dropData.frameId,
          },
          bonusCoins: dropData.bonusCoins,
          releaseDate: dropData.releaseDate,
          endDate: dropData.endDate,
        };
      }
    }
  }

  generateFileChecksum(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5');
    hash.update(fileBuffer);
    return hash.digest('hex').substring(0, 8);
  }

  async generateChecksums() {
    // Generate overall manifest checksum
    const manifestString = JSON.stringify({
      skins: this.manifest.skins,
      drops: this.manifest.drops,
    });

    const hash = crypto.createHash('sha256');
    hash.update(manifestString);
    this.manifest.checksums.manifest = hash.digest('hex');

    // Generate checksums for each drop
    Object.keys(this.manifest.drops).forEach((dropId) => {
      const dropHash = crypto.createHash('md5');
      dropHash.update(JSON.stringify(this.manifest.drops[dropId]));
      this.manifest.checksums[dropId] = dropHash.digest('hex').substring(0, 8);
    });
  }

  detectSkinType(skinId) {
    if (skinId.startsWith('cart_')) return 'cart';
    if (skinId.startsWith('trail_')) return 'trail';
    if (skinId.startsWith('badge_')) return 'badge';
    if (skinId.startsWith('frame_')) return 'frame';
    return 'unknown';
  }
}

// Run generator
const generator = new ManifestGenerator();
generator.generate().catch((error) => {
  console.error('Failed to generate manifest:', error);
  process.exit(1);
});
