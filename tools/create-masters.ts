#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

/**
 * Master Artwork Template Generator
 * Creates high-quality SVG and PNG templates for artists to use
 */

interface ArtworkTemplate {
  type: 'cart' | 'trail' | 'badge' | 'frame';
  width: number;
  height: number;
  guidelines: string[];
  safeArea: { x: number; y: number; width: number; height: number };
  colors: string[];
}

const TEMPLATES: Record<string, ArtworkTemplate> = {
  cart: {
    type: 'cart',
    width: 2048,
    height: 2048,
    guidelines: [
      'Main pot/cart centered',
      'Keep wheels/base in bottom 30%',
      'Gold elements should shine',
      'Add depth with shadows',
    ],
    safeArea: { x: 256, y: 256, width: 1536, height: 1536 },
    colors: ['#FFD700', '#FFA500', '#B8860B', '#DAA520'],
  },
  trail: {
    type: 'trail',
    width: 1024,
    height: 2048,
    guidelines: [
      'Seamless vertical pattern',
      'Particle effects work best',
      'Consider motion blur',
      'Keep it semi-transparent',
    ],
    safeArea: { x: 128, y: 0, width: 768, height: 2048 },
    colors: ['#FFD700', '#87CEEB', '#FF69B4', '#98FB98'],
  },
  badge: {
    type: 'badge',
    width: 512,
    height: 512,
    guidelines: [
      'Circular or shield shape',
      'Clear iconography',
      'Readable at small sizes',
      'Metallic finish recommended',
    ],
    safeArea: { x: 64, y: 64, width: 384, height: 384 },
    colors: ['#FFD700', '#C0C0C0', '#B87333', '#4169E1'],
  },
  frame: {
    type: 'frame',
    width: 2048,
    height: 2048,
    guidelines: [
      'Border/frame design',
      'Center area transparent',
      'Decorative corners',
      'Consistent thickness',
    ],
    safeArea: { x: 128, y: 128, width: 1792, height: 1792 },
    colors: ['#FFD700', '#8B4513', '#228B22', '#4B0082'],
  },
};

class MasterTemplateGenerator {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(__dirname, '..', 'assets', 'templates');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    ['svg', 'png', 'psd', 'guidelines'].forEach((subdir) => {
      const dir = path.join(this.outputDir, subdir);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateAll(): Promise<void> {
    console.log('🎨 Generating master artwork templates...\n');

    for (const [name, template] of Object.entries(TEMPLATES)) {
      await this.generateTemplate(name, template);
      await this.generateGuidelines(name, template);
    }

    await this.generateColorPalette();
    await this.generateDesignSystem();

    console.log('\n✅ All templates generated successfully!');
  }

  private async generateTemplate(name: string, template: ArtworkTemplate): Promise<void> {
    console.log(`📐 Creating ${name} template...`);

    // Generate SVG template
    const svg = this.createSVGTemplate(template);
    const svgPath = path.join(this.outputDir, 'svg', `${name}_template.svg`);
    fs.writeFileSync(svgPath, svg);

    // Generate PNG template with guides
    const pngPath = path.join(this.outputDir, 'png', `${name}_template.png`);
    await this.createPNGTemplate(template, pngPath);

    // Generate Photoshop template structure
    await this.createPSDStructure(name, template);

    console.log(`  ✓ ${name} template created`);
  }

  private createSVGTemplate(template: ArtworkTemplate): string {
    const { width, height, safeArea, colors } = template;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
     xmlns="http://www.w3.org/2000/svg">
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#F5F5F5" opacity="0.5"/>
  
  <!-- Grid -->
  <defs>
    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#CCCCCC" stroke-width="1" opacity="0.5"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  
  <!-- Safe Area -->
  <rect x="${safeArea.x}" y="${safeArea.y}" 
        width="${safeArea.width}" height="${safeArea.height}"
        fill="none" stroke="#00FF00" stroke-width="4" stroke-dasharray="20,10" opacity="0.8"/>
  
  <!-- Center Guides -->
  <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" 
        stroke="#FF00FF" stroke-width="2" stroke-dasharray="10,5" opacity="0.5"/>
  <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" 
        stroke="#FF00FF" stroke-width="2" stroke-dasharray="10,5" opacity="0.5"/>
  
  <!-- Golden Ratio Guides -->
  <line x1="${width * 0.382}" y1="0" x2="${width * 0.382}" y2="${height}" 
        stroke="#FFD700" stroke-width="1" stroke-dasharray="5,5" opacity="0.3"/>
  <line x1="${width * 0.618}" y1="0" x2="${width * 0.618}" y2="${height}" 
        stroke="#FFD700" stroke-width="1" stroke-dasharray="5,5" opacity="0.3"/>
  
  <!-- Color Palette -->
  <g id="palette" transform="translate(50, 50)">
    ${colors
      .map(
        (color, i) => `
    <rect x="${i * 80}" y="0" width="70" height="70" fill="${color}" stroke="#000" stroke-width="2"/>
    <text x="${i * 80 + 35}" y="90" text-anchor="middle" font-family="Arial" font-size="12">${color}</text>
    `
      )
      .join('')}
  </g>
  
  <!-- Labels -->
  <text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold">
    ${template.type.toUpperCase()} TEMPLATE - ${width}x${height}
  </text>
  
  <text x="${safeArea.x}" y="${safeArea.y - 10}" font-family="Arial" font-size="16" fill="#00FF00">
    SAFE AREA
  </text>
  
  <!-- YOUR ARTWORK HERE -->
  <g id="artwork-layer">
    <!-- Artist's content goes here -->
  </g>
</svg>`;
  }

  private async createPNGTemplate(template: ArtworkTemplate, outputPath: string): Promise<void> {
    const { width, height, safeArea, colors } = template;

    // Create base image with guides
    const svg = Buffer.from(`
      <svg width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#2a2a2a"/>
        
        <!-- Checkerboard pattern -->
        <defs>
          <pattern id="checker" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="50" height="50" fill="#333"/>
            <rect x="50" y="50" width="50" height="50" fill="#333"/>
          </pattern>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#checker)" opacity="0.5"/>
        
        <!-- Safe area -->
        <rect x="${safeArea.x}" y="${safeArea.y}" 
              width="${safeArea.width}" height="${safeArea.height}"
              fill="none" stroke="#00FF00" stroke-width="4" opacity="0.8"/>
        
        <!-- Rule of thirds -->
        <line x1="${width / 3}" y1="0" x2="${width / 3}" y2="${height}" stroke="#FFF" stroke-width="1" opacity="0.2"/>
        <line x1="${(width * 2) / 3}" y1="0" x2="${(width * 2) / 3}" y2="${height}" stroke="#FFF" stroke-width="1" opacity="0.2"/>
        <line x1="0" y1="${height / 3}" x2="${width}" y2="${height / 3}" stroke="#FFF" stroke-width="1" opacity="0.2"/>
        <line x1="0" y1="${(height * 2) / 3}" x2="${width}" y2="${(height * 2) / 3}" stroke="#FFF" stroke-width="1" opacity="0.2"/>
        
        <!-- Type label -->
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" 
              font-family="Arial" font-size="${Math.min(width, height) / 10}" 
              fill="#FFD700" opacity="0.3">
          ${template.type.toUpperCase()}
        </text>
      </svg>
    `);

    await sharp(svg).png().toFile(outputPath);
  }

  private async createPSDStructure(name: string, template: ArtworkTemplate): Promise<void> {
    const structureFile = path.join(this.outputDir, 'psd', `${name}_structure.json`);

    const psdStructure = {
      name: `${name}_template.psd`,
      width: template.width,
      height: template.height,
      colorMode: 'RGB',
      bitDepth: 16,
      layers: [
        {
          name: 'Guidelines',
          type: 'group',
          locked: true,
          opacity: 50,
          layers: [
            { name: 'Safe Area', type: 'shape', color: '#00FF00' },
            { name: 'Grid', type: 'pattern', visible: false },
            { name: 'Center Guides', type: 'guides' },
          ],
        },
        {
          name: 'Artwork',
          type: 'group',
          layers: [
            { name: 'Effects', type: 'normal', blendMode: 'screen' },
            { name: 'Main Design', type: 'normal' },
            { name: 'Background', type: 'normal' },
          ],
        },
        {
          name: 'Color Swatches',
          type: 'group',
          locked: true,
          layers: template.colors.map((color, i) => ({
            name: `Color ${i + 1}`,
            type: 'fill',
            color: color,
          })),
        },
      ],
    };

    fs.writeFileSync(structureFile, JSON.stringify(psdStructure, null, 2));
  }

  private async generateGuidelines(name: string, template: ArtworkTemplate): Promise<void> {
    const guidelinesPath = path.join(this.outputDir, 'guidelines', `${name}_guidelines.md`);

    const content = `# ${template.type.toUpperCase()} Artwork Guidelines

## Specifications
- **Dimensions**: ${template.width} × ${template.height} pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Bit Depth**: 8-bit per channel (24-bit for RGB, 32-bit with alpha)

## Safe Area
- **Position**: (${template.safeArea.x}, ${template.safeArea.y})
- **Size**: ${template.safeArea.width} × ${template.safeArea.height}
- Keep all important elements within this area

## Design Guidelines
${template.guidelines.map((g) => `- ${g}`).join('\n')}

## Color Palette
Recommended colors for this asset type:
${template.colors.map((c) => `- \`${c}\` - ${this.getColorName(c)}`).join('\n')}

## Export Settings
1. **Master File**: Save as PSD/AI at 2x template size
2. **Production**: Export as PNG at template size
3. **Optimization**: Use pngquant for file size reduction
4. **Naming**: Use format \`${template.type}_[name]_v[version].png\`

## Quality Checklist
- [ ] Asset fits within safe area
- [ ] Transparent background (if applicable)
- [ ] No pixelation at 100% zoom
- [ ] Consistent with game art style
- [ ] Optimized file size (<500KB for heroes, <200KB for game assets)
- [ ] Tested on both phone and tablet layouts
- [ ] Follows accessibility guidelines (sufficient contrast)

## Platform-Specific Notes
### iOS
- Provide @1x, @2x, @3x variants
- Test on iPhone SE to iPhone Pro Max
- Ensure Retina display compatibility

### Android
- Support mdpi to xxxhdpi densities  
- Test on various aspect ratios
- Consider navigation bar/notch areas

## Version Control
- Keep source files in \`assets/masters/\`
- Tag releases with version numbers
- Document changes in CHANGELOG.md
`;

    fs.writeFileSync(guidelinesPath, content);
  }

  private async generateColorPalette(): Promise<void> {
    const palettePath = path.join(this.outputDir, 'color_palette.json');

    const palette = {
      primary: {
        gold: '#FFD700',
        goldDark: '#B8860B',
        goldLight: '#FFED4E',
        goldMuted: '#DAA520',
      },
      secondary: {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        copper: '#B87333',
        platinum: '#E5E4E2',
      },
      seasonal: {
        spring: '#98FB98',
        summer: '#87CEEB',
        autumn: '#FF8C00',
        winter: '#B0E0E6',
      },
      ui: {
        success: '#4CAF50',
        warning: '#FFA500',
        error: '#F44336',
        info: '#2196F3',
      },
      neutrals: {
        black: '#1a1a1a',
        darkGray: '#2a2a2a',
        gray: '#666666',
        lightGray: '#CCCCCC',
        white: '#FFFFFF',
      },
    };

    fs.writeFileSync(palettePath, JSON.stringify(palette, null, 2));
  }

  private async generateDesignSystem(): Promise<void> {
    const designSystemPath = path.join(this.outputDir, 'design_system.md');

    const content = `# Pot of Gold - Visual Design System

## Art Direction
**Theme**: Premium, magical, treasure-hunting adventure
**Style**: Semi-realistic with stylized elements
**Mood**: Exciting, rewarding, mystical

## Visual Hierarchy

### Primary Elements (Carts)
- Most detailed and elaborate
- Rich textures and materials
- Dynamic lighting and shadows
- Particle effects for premium skins

### Secondary Elements (Trails)
- Flowing, animated patterns
- Semi-transparent overlays
- Complementary to cart designs
- Motion-focused aesthetics

### Tertiary Elements (Badges & Frames)
- Simple, iconic designs
- High contrast for readability
- Metallic finishes
- Consistent border weights

## Material Guidelines

### Metals
- **Gold**: Warm yellows with orange highlights
- **Silver**: Cool grays with blue tints
- **Bronze**: Deep oranges with brown shadows
- **Copper**: Reddish-brown with pink highlights

### Effects
- **Glow**: Soft outer glow at 20-30% opacity
- **Sparkles**: Small, animated particles
- **Shine**: Diagonal light streak animations
- **Shadow**: Soft drop shadow at 30% opacity

## Animation Principles
1. **Easing**: Use ease-in-out for smooth motion
2. **Duration**: 200-500ms for UI transitions
3. **Loops**: Seamless for continuous effects
4. **Performance**: 60fps target, optimize for mobile

## Responsive Scaling

### Breakpoints
- Phone: 320-767px
- Tablet: 768-1024px
- Large Tablet: 1024px+

### Asset Scaling
- @1x: Base resolution (360px cart width)
- @2x: Retina displays (720px)
- @3x: Super Retina (1080px)

## Accessibility

### Contrast Ratios
- Text on background: 4.5:1 minimum
- Important graphics: 3:1 minimum
- Decorative elements: No requirement

### Motion
- Respect reduced motion preferences
- Provide static alternatives
- Avoid rapid flashing (<3Hz)

## File Optimization

### Target Sizes
- Hero images: <500KB
- Game assets: <200KB
- Thumbnails: <50KB
- Icons: <20KB

### Compression
- PNG: pngquant 85-95 quality
- WebP: 80-90 quality (where supported)
- SVG: SVGO optimization

## Monthly Theme Guidelines

### Seasonal Alignment
- **Jan-Mar**: Winter/New Year themes
- **Apr-Jun**: Spring/Easter themes
- **Jul-Sep**: Summer/Independence themes
- **Oct-Dec**: Autumn/Holiday themes

### Color Coordination
Each month should have a dominant color:
- January: Ice Blue
- February: Rose Pink
- March: Emerald Green
- April: Pastel Yellow
- May: Blossom Pink
- June: Ocean Blue
- July: Firework Red
- August: Sun Gold
- September: Harvest Orange
- October: Mystic Purple
- November: Amber Brown
- December: Festive Red/Green

## Quality Standards

### Technical Requirements
- [ ] RGB color space
- [ ] Embedded color profile (sRGB)
- [ ] Correct dimensions
- [ ] Proper transparency
- [ ] Optimized file size

### Visual Requirements
- [ ] Consistent art style
- [ ] Proper lighting direction
- [ ] Clean edges (no jaggies)
- [ ] Balanced composition
- [ ] Brand alignment

### Testing Requirements
- [ ] Looks good on light/dark backgrounds
- [ ] Scales well to different sizes
- [ ] Readable at minimum size
- [ ] No visual artifacts
- [ ] Smooth animations

## Approval Process
1. Artist creates initial concept
2. Review against guidelines
3. Test on target devices
4. Optimize and polish
5. Final QA check
6. Integration testing
7. Production release
`;

    fs.writeFileSync(designSystemPath, content);
  }

  private getColorName(hex: string): string {
    const colorNames: Record<string, string> = {
      '#FFD700': 'Gold',
      '#FFA500': 'Orange',
      '#B8860B': 'Dark Goldenrod',
      '#DAA520': 'Goldenrod',
      '#87CEEB': 'Sky Blue',
      '#FF69B4': 'Hot Pink',
      '#98FB98': 'Pale Green',
      '#C0C0C0': 'Silver',
      '#B87333': 'Copper',
      '#4169E1': 'Royal Blue',
      '#8B4513': 'Saddle Brown',
      '#228B22': 'Forest Green',
      '#4B0082': 'Indigo',
    };

    return colorNames[hex] || 'Custom Color';
  }
}

// Run generator
async function main() {
  const generator = new MasterTemplateGenerator();
  await generator.generateAll();
}

main().catch((error) => {
  console.error('Failed to generate templates:', error);
  process.exit(1);
});
