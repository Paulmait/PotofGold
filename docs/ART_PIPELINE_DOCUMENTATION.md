# 🎨 Pot of Gold - Art Pipeline Documentation

## Table of Contents
1. [Overview](#overview)
2. [Asset Architecture](#asset-architecture)
3. [Art Generation Pipeline](#art-generation-pipeline)
4. [CI/CD Integration](#cicd-integration)
5. [Component Integration](#component-integration)
6. [Performance Optimization](#performance-optimization)
7. [Quality Standards](#quality-standards)
8. [Troubleshooting](#troubleshooting)

## Overview

The Pot of Gold art pipeline is a comprehensive system for managing, generating, and displaying game assets across mobile devices. It provides automatic asset optimization, responsive display, and seamless integration with the monthly drops system.

### Key Features
- ✅ Automatic generation of @1x/@2x/@3x variants
- ✅ Device-specific hero images (phone/tablet)
- ✅ Sharp-based image processing
- ✅ expo-image integration for optimal performance
- ✅ CI/CD automation with GitHub Actions
- ✅ Visual regression testing
- ✅ Asset validation and compliance checking

## Asset Architecture

### Directory Structure
```
assets/
├── skins/
│   ├── masters/              # Master artwork files (2048px+)
│   ├── {skinId}/
│   │   ├── raster/           # Game-ready assets
│   │   │   ├── {skinId}.png      # @1x (base resolution)
│   │   │   ├── {skinId}@2x.png   # @2x (Retina)
│   │   │   └── {skinId}@3x.png   # @3x (Super Retina)
│   │   ├── previews/         # Marketing & hero images
│   │   │   ├── hero_phone_1080x1920.png
│   │   │   ├── hero_tablet_1536x2048.png
│   │   │   ├── tile_1024.png
│   │   │   └── banner_1600x900.png
│   │   └── thumbnails/       # Small preview images
│   │       ├── thumb.png         # @1x (80px)
│   │       ├── thumb@2x.png      # @2x (160px)
│   │       └── thumb@3x.png      # @3x (240px)
├── drops/                    # Monthly drop definitions
│   └── month_{01-12}.json
└── templates/               # Artist templates & guidelines
    ├── svg/                 # Vector templates
    ├── png/                 # Raster templates
    ├── psd/                 # Photoshop structures
    └── guidelines/          # Design documentation
```

### Asset Types & Dimensions

| Type | Base Size | @2x Size | @3x Size | Usage |
|------|-----------|----------|----------|--------|
| **Cart** | 360px | 720px | 1080px | Main pot/cart sprite |
| **Trail** | 240px | 480px | 720px | Movement effects |
| **Badge** | 120px | 240px | 360px | Achievement icons |
| **Frame** | 400px | 800px | 1200px | UI borders/frames |

### Hero Images

| Device | Resolution | Aspect Ratio | Usage |
|--------|------------|--------------|--------|
| **Phone** | 1080×1920 | 9:16 | Full-screen previews |
| **Tablet** | 1536×2048 | 3:4 | iPad-optimized views |

## Art Generation Pipeline

### 1. Manual Asset Creation
Artists create master artwork using provided templates:

```bash
# Generate templates for artists
npm run generate-templates

# Output:
# - assets/templates/svg/cart_template.svg
# - assets/templates/png/cart_template.png
# - assets/templates/guidelines/cart_guidelines.md
```

### 2. Automated Processing
The pipeline automatically generates all required variants:

```bash
# Generate all assets from masters
npm run generate-art

# Generate specific drop assets
npm run generate-art -- --drop month_08

# Watch mode for development
npm run generate-art:watch
```

### 3. Processing Steps

```typescript
// tools/generate-art.ts workflow
1. Load master artwork (2048px+)
2. Generate @1x/@2x/@3x variants
3. Create device-specific hero images
4. Generate thumbnails
5. Optimize with pngquant
6. Validate dimensions & file sizes
7. Update manifest.json
```

### 4. Validation
Automated validation ensures quality:

```bash
# Run validation suite
node tools/validate-assets.js

# Checks:
# ✓ Required files exist
# ✓ Correct dimensions
# ✓ File size limits
# ✓ No orphaned assets
# ✓ Manifest integrity
```

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/art-generation.yml` workflow automates:

1. **Trigger Events**
   - Push to `assets/drops/*.json`
   - Push to `tools/generate-art.ts`
   - Manual workflow dispatch

2. **Processing Steps**
   ```yaml
   - Detect changed drops
   - Generate affected assets
   - Validate generated files
   - Optimize with pngquant
   - Update manifest
   - Commit changes
   ```

3. **Quality Gates**
   - Asset validation must pass
   - File sizes within limits
   - Visual regression tests
   - Compliance checks

### Manual Deployment

```bash
# Full regeneration
npm run generate-art

# Validate before commit
node tools/validate-assets.js

# Generate manifest
node tools/generate-manifest.js > assets/manifest.json

# Commit
git add assets/
git commit -m "🎨 Update game assets"
```

## Component Integration

### OptimizedArt Component

High-performance image display with expo-image:

```tsx
import { OptimizedArt } from '../src/components/OptimizedArt';

// Basic usage
<OptimizedArt
  skinId="cart_aurora_gold_v1"
  type="cart"
  variant="thumbnail"
/>

// Hero image with preloading
<OptimizedArt
  skinId={dropData.cartSkinId}
  type="cart"
  variant="hero"
  priority="high"
  showPlaceholder={true}
  onLoad={() => console.log('Loaded')}
/>

// Custom styling
<OptimizedArt
  skinId={selectedSkin}
  type="badge"
  variant="raster"
  containerStyle={styles.customContainer}
  imageStyle={styles.customImage}
  contentFit="cover"
/>
```

### Preloading Assets

```typescript
import { preloadDropAssets } from '../src/components/OptimizedArt';

// Preload monthly drop assets
await preloadDropAssets('drop_2025_08');

// Batch preload multiple skins
const skins = ['cart_aurora_gold_v1', 'trail_sunflare_v1'];
for (const skin of skins) {
  await preloadDropAssets(skin);
}
```

### Shop Integration

```tsx
// Shop item with visual preview
<TouchableOpacity onPress={() => handleItemPress(item)}>
  <OptimizedArt
    skinId={item.id}
    type={item.type}
    variant="thumbnail"
    showPlaceholder={true}
  />
  <Text>{item.name}</Text>
  <Text>{item.price} coins</Text>
</TouchableOpacity>

// Preview modal
<Modal visible={showPreview}>
  <OptimizedArt
    skinId={selectedItem.id}
    type={selectedItem.type}
    variant="hero"
    priority="high"
  />
</Modal>
```

### Locker Integration

```tsx
// Collection grid
{collection.map(item => (
  <View key={item.id}>
    <OptimizedArt
      skinId={item.id}
      type={item.type}
      variant="thumbnail"
    />
    {item.equipped && <EquippedBadge />}
  </View>
))}

// Current loadout display
<View style={styles.loadout}>
  {Object.entries(equipped).map(([type, skinId]) => (
    <OptimizedArt
      key={type}
      skinId={skinId}
      type={type}
      variant="thumbnail"
    />
  ))}
</View>
```

## Performance Optimization

### Image Optimization

1. **File Size Targets**
   - Hero images: <500KB
   - Game assets: <200KB
   - Thumbnails: <50KB

2. **Compression Settings**
   ```javascript
   // Sharp compression
   sharp(input)
     .png({ 
       quality: 90,
       compressionLevel: 9,
       adaptiveFiltering: true
     })
   
   // Post-processing with pngquant
   pngquant --quality=85-95 --ext=.png --force
   ```

3. **Caching Strategy**
   ```typescript
   // expo-image caching
   cachePolicy="memory-disk"  // Default
   cachePolicy="disk"         // Large images
   cachePolicy="memory"       // Frequently accessed
   cachePolicy="none"         // Dynamic content
   ```

### Loading Performance

1. **Lazy Loading**
   ```tsx
   // Load images as they enter viewport
   <FlatList
     data={items}
     renderItem={({ item }) => (
       <OptimizedArt
         skinId={item.id}
         priority={item.visible ? 'high' : 'low'}
       />
     )}
   />
   ```

2. **Progressive Loading**
   ```tsx
   // Blurhash placeholders
   const BLURHASH_PLACEHOLDERS = {
     cart: 'L6H2:g00~q00_3%M%M%M~q00%M%M',
     trail: 'L5H2EC=PM+%M~q%M~q%M%M%M~q%M',
   };
   ```

3. **Preloading Strategy**
   ```typescript
   // Preload next month's drop
   useEffect(() => {
     const nextMonth = getNextMonthDrop();
     preloadDropAssets(nextMonth.id);
   }, [currentMonth]);
   ```

### Memory Management

1. **Image Recycling**
   ```tsx
   // Use recyclingKey for list items
   <OptimizedArt
     recyclingKey={`${skinId}-${variant}`}
     allowDownscaling={true}
   />
   ```

2. **Cache Clearing**
   ```typescript
   import { clearImageCache } from '../src/components/OptimizedArt';
   
   // Clear on app update
   await clearImageCache();
   ```

## Quality Standards

### Technical Requirements

- **Color Space**: sRGB
- **Bit Depth**: 8-bit per channel (24-bit RGB, 32-bit RGBA)
- **Format**: PNG with transparency
- **Compression**: Lossless with optimization
- **Metadata**: Stripped for smaller files

### Visual Requirements

- **Consistency**: Match game art style
- **Clarity**: No pixelation at 100% zoom
- **Contrast**: Minimum 3:1 for important graphics
- **Transparency**: Clean edges, no halos
- **Animation**: 60fps for any animated elements

### Accessibility

- **Contrast Ratios**: 4.5:1 for text, 3:1 for graphics
- **Motion**: Respect reduced motion preferences
- **Alt Text**: Descriptive labels for screen readers
- **Color Blind**: Test with various color blind modes

## Troubleshooting

### Common Issues

#### 1. Missing Assets
```bash
# Regenerate missing assets
npm run generate-art

# Validate
node tools/validate-assets.js
```

#### 2. Wrong Dimensions
```bash
# Check master file dimensions
identify assets/skins/masters/cart_aurora_gold_v1.png

# Regenerate if needed
npm run generate-art -- --skin cart_aurora_gold_v1
```

#### 3. Performance Issues
```typescript
// Clear cache
await clearImageCache();

// Reduce quality for low-end devices
const quality = DeviceInfo.getTotalMemory() < 2GB ? 'low' : 'high';
```

#### 4. Build Errors
```bash
# Clean and rebuild
rm -rf node_modules/.cache
npm run generate-art
npx expo start -c
```

### Debug Commands

```bash
# Check asset manifest
cat assets/manifest.json | jq '.skins | keys'

# Verify file sizes
find assets/skins -name "*.png" -exec ls -lh {} \;

# Test specific skin
node -e "require('./tools/generate-art').processSkin('cart_aurora_gold_v1')"

# Validate drops
for i in {01..12}; do
  echo "Validating month_$i.json"
  jq . assets/drops/month_$i.json > /dev/null
done
```

## Best Practices

### For Artists

1. **Use Templates**: Start with provided SVG/PSD templates
2. **Work at 2x**: Create at 4096px, export at 2048px
3. **Layer Organization**: Keep effects separate for easy editing
4. **Version Control**: Save incremental versions
5. **Test Early**: Preview on actual devices before finalizing

### For Developers

1. **Batch Operations**: Process multiple assets together
2. **Error Handling**: Always provide fallbacks
3. **Progressive Enhancement**: Load low-res first, then high-res
4. **Monitor Performance**: Track image load times
5. **Update Documentation**: Document any pipeline changes

### For QA

1. **Device Testing**: Test on min/max screen sizes
2. **Network Testing**: Verify loading on slow connections
3. **Memory Testing**: Monitor memory usage during gameplay
4. **Visual Testing**: Compare against design specs
5. **Accessibility Testing**: Verify with screen readers

## Appendix

### Supported Devices

| Platform | Min Resolution | Max Resolution | DPI Range |
|----------|---------------|----------------|-----------|
| iOS | 375×667 (iPhone SE) | 430×932 (iPhone Pro Max) | @2x-@3x |
| Android | 360×640 (Budget) | 412×915 (Premium) | mdpi-xxxhdpi |
| iPad | 768×1024 (Mini) | 1024×1366 (Pro) | @2x |

### File Size Budget

| Asset Type | Compressed | Uncompressed | Network |
|------------|------------|--------------|----------|
| Hero Image | <500KB | <2MB | WiFi preferred |
| Game Asset | <200KB | <800KB | Any network |
| Thumbnail | <50KB | <200KB | Any network |
| Icon | <20KB | <80KB | Any network |

### Performance Metrics

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| First Load | <500ms | <1s | >2s |
| Subsequent Load | <100ms | <250ms | >500ms |
| Memory Usage | <50MB | <100MB | >200MB |
| FPS Impact | 60fps | 30fps | <30fps |

---

## Support

For questions or issues:
- 📧 Email: gamedev@potofgold.com
- 💬 Discord: discord.gg/potofgold
- 📚 Wiki: github.com/potofgold/wiki
- 🐛 Issues: github.com/potofgold/issues

Last Updated: August 2025
Version: 1.0.0