import fs from "fs";
import path from "path";
import sharp from "sharp";

type Job = {
  id: string;              // e.g., cart_aurora_gold_v1
  master: string;          // path to master PNG/SVG
  outDir: string;          // skin folder
  transparent?: boolean;   // default true
  type: 'cart' | 'trail' | 'badge' | 'frame';
};

// Load all drops to generate art for
const dropsPath = path.join(__dirname, "../assets/drops");
const dropFiles = fs.readdirSync(dropsPath)
  .filter(f => f.startsWith("month_") && f.endsWith(".json"));

// Build jobs array from drop files
const SKINS: Job[] = [];

dropFiles.forEach(file => {
  const dropData = JSON.parse(
    fs.readFileSync(path.join(dropsPath, file), "utf-8")
  );
  
  // Add cart skin job
  SKINS.push({
    id: dropData.cartSkinId,
    master: `assets/skins/masters/${dropData.cartSkinId}.png`,
    outDir: `assets/skins/${dropData.cartSkinId}`,
    transparent: true,
    type: 'cart'
  });
  
  // Add trail job
  SKINS.push({
    id: dropData.trailId,
    master: `assets/skins/masters/${dropData.trailId}.png`,
    outDir: `assets/skins/${dropData.trailId}`,
    transparent: true,
    type: 'trail'
  });
  
  // Add badge job
  SKINS.push({
    id: dropData.badgeId,
    master: `assets/skins/masters/${dropData.badgeId}.png`,
    outDir: `assets/skins/${dropData.badgeId}`,
    transparent: true,
    type: 'badge'
  });
  
  // Add frame job
  SKINS.push({
    id: dropData.frameId,
    master: `assets/skins/masters/${dropData.frameId}.png`,
    outDir: `assets/skins/${dropData.frameId}`,
    transparent: true,
    type: 'frame'
  });
});

const scales = [
  { suffix: "",    mult: 1 },  // @1x for standard density
  { suffix: "@2x", mult: 2 },  // @2x for retina
  { suffix: "@3x", mult: 3 }   // @3x for super retina
];

async function exportRenditions(job: Job) {
  // Check if master file exists
  if (!fs.existsSync(job.master)) {
    console.warn(`⚠️  Master file not found: ${job.master}`);
    return;
  }

  const rasterDir = path.join(job.outDir, "raster");
  const previewsDir = path.join(job.outDir, "previews");
  fs.mkdirSync(rasterDir, { recursive: true });
  fs.mkdirSync(previewsDir, { recursive: true });

  // Different base sizes for different asset types
  const baseSizes = {
    cart: 360,   // Cart width in points
    trail: 240,  // Trail width
    badge: 120,  // Badge size
    frame: 400   // Frame width
  };
  
  const baseWidth = baseSizes[job.type];

  // 1) Generate in-game raster images @1x/@2x/@3x
  console.log(`  Generating rasters for ${job.id}...`);
  
  for (const s of scales) {
    const width = Math.floor(baseWidth * s.mult);
    const out = path.join(rasterDir, `${job.id}${s.suffix}.png`);
    
    try {
      await sharp(job.master)
        .resize({ 
          width, 
          withoutEnlargement: true,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ 
          quality: 92,
          compressionLevel: 9,
          effort: 10
        })
        .toFile(out);
      
      console.log(`    ✓ ${out} (${width}px)`);
    } catch (error) {
      console.error(`    ✗ Failed to generate ${out}:`, error);
    }
  }

  // 2) Generate Vault hero previews (for main items only)
  if (job.type === 'cart' || job.type === 'trail') {
    console.log(`  Generating hero previews for ${job.id}...`);
    
    // Phone hero: 1080×1920
    const heroPhone = path.join(previewsDir, `hero_phone_1080x1920.png`);
    try {
      await sharp(job.master)
        .resize({ 
          width: 1080, 
          height: 1920, 
          fit: "contain", 
          background: { r: 26, g: 26, b: 26, alpha: 1 } // Dark background
        })
        .composite([{
          input: Buffer.from(`
            <svg width="1080" height="1920">
              <defs>
                <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.2" />
                  <stop offset="100%" style="stop-color:#FFD700;stop-opacity:0" />
                </linearGradient>
              </defs>
              <rect width="1080" height="200" fill="url(#glow)" />
            </svg>
          `),
          top: 0,
          left: 0
        }])
        .png({ quality: 95 })
        .toFile(heroPhone);
      console.log(`    ✓ ${heroPhone}`);
    } catch (error) {
      console.error(`    ✗ Failed to generate phone hero:`, error);
    }

    // Tablet hero: 1536×2048
    const heroTablet = path.join(previewsDir, `hero_tablet_1536x2048.png`);
    try {
      await sharp(job.master)
        .resize({ 
          width: 1536, 
          height: 2048, 
          fit: "contain", 
          background: { r: 26, g: 26, b: 26, alpha: 1 }
        })
        .composite([{
          input: Buffer.from(`
            <svg width="1536" height="2048">
              <defs>
                <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.2" />
                  <stop offset="100%" style="stop-color:#FFD700;stop-opacity:0" />
                </linearGradient>
              </defs>
              <rect width="1536" height="250" fill="url(#glow)" />
            </svg>
          `),
          top: 0,
          left: 0
        }])
        .png({ quality: 95 })
        .toFile(heroTablet);
      console.log(`    ✓ ${heroTablet}`);
    } catch (error) {
      console.error(`    ✗ Failed to generate tablet hero:`, error);
    }
  }

  // 3) Generate marketing tiles
  console.log(`  Generating marketing assets for ${job.id}...`);
  
  // Square tile: 1024×1024
  const tile = path.join(previewsDir, `tile_1024.png`);
  try {
    await sharp(job.master)
      .resize({ 
        width: 1024, 
        height: 1024, 
        fit: "contain", 
        background: { r: 42, g: 42, b: 42, alpha: 1 }
      })
      .png({ quality: 92 })
      .toFile(tile);
    console.log(`    ✓ ${tile}`);
  } catch (error) {
    console.error(`    ✗ Failed to generate tile:`, error);
  }

  // Banner: 1600×900
  const banner = path.join(previewsDir, `banner_1600x900.png`);
  try {
    await sharp(job.master)
      .resize({ 
        width: 1600, 
        height: 900, 
        fit: "contain", 
        background: { r: 26, g: 26, b: 26, alpha: 1 }
      })
      .png({ quality: 92 })
      .toFile(banner);
    console.log(`    ✓ ${banner}`);
  } catch (error) {
    console.error(`    ✗ Failed to generate banner:`, error);
  }

  // 4) Generate thumbnail for shop/locker
  const thumbDir = path.join(job.outDir, "thumbnails");
  fs.mkdirSync(thumbDir, { recursive: true });
  
  for (const s of scales) {
    const size = Math.floor(80 * s.mult); // 80pt thumbnail size
    const thumbOut = path.join(thumbDir, `thumb${s.suffix}.png`);
    
    try {
      await sharp(job.master)
        .resize({ 
          width: size, 
          height: size,
          fit: 'cover',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 90 })
        .toFile(thumbOut);
      console.log(`    ✓ ${thumbOut} (${size}px)`);
    } catch (error) {
      console.error(`    ✗ Failed to generate thumbnail:`, error);
    }
  }
}

// Generate placeholder/template masters if they don't exist
async function createPlaceholderMasters() {
  const mastersDir = path.join(__dirname, "../assets/skins/masters");
  fs.mkdirSync(mastersDir, { recursive: true });
  
  for (const job of SKINS) {
    if (!fs.existsSync(job.master)) {
      console.log(`📝 Creating placeholder for ${job.id}...`);
      
      // Create a simple colored placeholder based on type
      const colors = {
        cart: { r: 255, g: 215, b: 0 },    // Gold
        trail: { r: 138, g: 43, b: 226 },  // Purple
        badge: { r: 0, g: 191, b: 255 },   // Blue
        frame: { r: 50, g: 205, b: 50 }    // Green
      };
      
      const color = colors[job.type];
      const size = job.type === 'frame' ? 2048 : 1024;
      
      // Create SVG placeholder
      const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="rgb(${color.r}, ${color.g}, ${color.b})" opacity="0.8"/>
          <text x="50%" y="50%" font-family="Arial" font-size="${size/10}" fill="white" text-anchor="middle" dy=".3em">
            ${job.id}
          </text>
          <text x="50%" y="60%" font-family="Arial" font-size="${size/20}" fill="white" text-anchor="middle" dy=".3em">
            ${job.type.toUpperCase()}
          </text>
        </svg>
      `;
      
      try {
        await sharp(Buffer.from(svg))
          .png()
          .toFile(job.master);
        console.log(`  ✓ Created placeholder: ${job.master}`);
      } catch (error) {
        console.error(`  ✗ Failed to create placeholder:`, error);
      }
    }
  }
}

// Main execution
(async () => {
  console.log("🎨 Starting art generation pipeline...\n");
  
  // Create placeholder masters if needed
  await createPlaceholderMasters();
  
  // Process all skins
  console.log(`\n📦 Processing ${SKINS.length} assets...\n`);
  
  for (const job of SKINS) {
    console.log(`Processing: ${job.id} (${job.type})`);
    await exportRenditions(job);
    console.log("");
  }
  
  console.log("✅ Art generation complete!");
  console.log(`   Generated assets for ${SKINS.length} items`);
  console.log(`   Output locations:`);
  console.log(`   - Rasters: assets/skins/[id]/raster/`);
  console.log(`   - Previews: assets/skins/[id]/previews/`);
  console.log(`   - Thumbnails: assets/skins/[id]/thumbnails/`);
})();