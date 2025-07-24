# Mine Cart Assets

This directory contains the visual assets for the mine cart theme.

## Required Assets

### mine_cart.png
- **Dimensions**: 60x40 pixels
- **Style**: 2D side view, cartoon style
- **Colors**: 
  - Brown wood (#8B4513) for cart body
  - Dark grey (#696969) for metal straps
  - Black (#2F2F2F) for wheels
- **Features**: Wooden planks, metal straps, visible wheels

### rail_track.png
- **Dimensions**: Full width x 20 pixels height
- **Style**: Decorative horizontal rail track
- **Colors**:
  - Dark grey (#696969) for rails
  - Brown (#8B4513) for wooden ties
- **Position**: Bottom of screen

## Optional Enhancements

### wheel_animation.png
- **Dimensions**: 12x12 pixels per wheel
- **Style**: Spinning wheel frames
- **Usage**: Animate wheels when cart moves

### dust_particles.png
- **Dimensions**: 2x2 pixels per particle
- **Style**: Small dust particles
- **Usage**: Show dust when cart moves fast

## Implementation Notes

1. **Hitbox**: The mine cart has an extended hitbox for better collision detection
2. **Wheel Animation**: Wheels spin based on movement direction and distance
3. **Dust Effects**: Optional dust particles appear during fast movement
4. **Sound Effects**: Consider adding wheel clank sounds for direction changes

## Asset Specifications

- **Format**: PNG with transparency
- **Optimization**: Compressed for mobile performance
- **Scaling**: Assets should scale well on different screen sizes
- **Theme**: Consistent with the cartoon/mine theme 