import React, { useRef, useEffect, useCallback, memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface CanvasRendererProps {
  width: number;
  height: number;
  items: Array<{
    id: string;
    x: number;
    y: number;
    type: string;
    emoji: string;
    collected: boolean;
  }>;
  cartPosition: { x: number; y: number };
  cartEmoji: string;
  activePowerUps: Map<string, number>;
  onItemCollect?: (item: any) => void;
  fps?: number;
}

const HTML5CanvasRenderer: React.FC<CanvasRendererProps> = memo(
  ({ width, height, items, cartPosition, cartEmoji, activePowerUps, onItemCollect, fps = 60 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const lastFrameTime = useRef<number>(0);
    const particlesRef = useRef<
      Array<{ x: number; y: number; vx: number; vy: number; life: number }>
    >([]);

    // Preload emoji images for better performance
    const emojiCache = useRef<Map<string, HTMLImageElement>>(new Map());

    const loadEmojiAsImage = useCallback((emoji: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (emojiCache.current.has(emoji)) {
          resolve(emojiCache.current.get(emoji)!);
          return;
        }

        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(img);
          return;
        }

        canvas.width = 64;
        canvas.height = 64;
        ctx.font = '48px system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 32, 32);

        img.onload = () => {
          emojiCache.current.set(emoji, img);
          resolve(img);
        };

        img.src = canvas.toDataURL();
      });
    }, []);

    const drawGame = useCallback(
      (ctx: CanvasRenderingContext2D, deltaTime: number) => {
        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(0.7, '#98D8E8');
        gradient.addColorStop(1, '#F0E68C'); // Sandy yellow
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw ground
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, height - 60, width, 60);

        // Draw particles (collection effects)
        particlesRef.current = particlesRef.current.filter((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.5; // gravity
          particle.life -= 2;

          if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.life / 100;
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
          }
          return false;
        });

        // Draw falling items
        items.forEach((item) => {
          if (!item.collected) {
            ctx.save();

            // Add glow effect for special items
            if (item.type === 'gem' || item.type === 'diamond') {
              ctx.shadowBlur = 20;
              ctx.shadowColor = item.type === 'gem' ? '#FF1493' : '#00CED1';
            }

            // Draw emoji
            ctx.font = '32px system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji, item.x, item.y);

            ctx.restore();
          }
        });

        // Draw power-up effects
        if (activePowerUps.has('magnet')) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(cartPosition.x, cartPosition.y - 30, 100, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (activePowerUps.has('shield')) {
          ctx.save();
          const shieldGradient = ctx.createRadialGradient(
            cartPosition.x,
            cartPosition.y - 30,
            0,
            cartPosition.x,
            cartPosition.y - 30,
            50
          );
          shieldGradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
          shieldGradient.addColorStop(1, 'rgba(0, 255, 255, 0.1)');
          ctx.fillStyle = shieldGradient;
          ctx.beginPath();
          ctx.arc(cartPosition.x, cartPosition.y - 30, 50, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw cart
        ctx.save();
        ctx.font = '48px system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add cart shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowOffsetY = 5;

        ctx.fillText(cartEmoji, cartPosition.x, cartPosition.y - 30);
        ctx.restore();

        // Draw 2x multiplier effect
        if (activePowerUps.has('doublePoints')) {
          ctx.save();
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          const text = 'x2';
          ctx.strokeText(text, cartPosition.x + 30, cartPosition.y - 50);
          ctx.fillText(text, cartPosition.x + 30, cartPosition.y - 50);
          ctx.restore();
        }
      },
      [width, height, items, cartPosition, cartEmoji, activePowerUps]
    );

    const animate = useCallback(
      (currentTime: number) => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d', {
          alpha: false,
          desynchronized: true, // Better performance
        });

        if (!ctx) return;

        const deltaTime = currentTime - lastFrameTime.current;
        const targetFrameTime = 1000 / fps;

        // Only render if enough time has passed
        if (deltaTime >= targetFrameTime) {
          drawGame(ctx, deltaTime);
          lastFrameTime.current = currentTime;
        }

        animationRef.current = requestAnimationFrame(animate);
      },
      [drawGame, fps]
    );

    // Add particle effect when item is collected
    const addCollectionParticles = useCallback((x: number, y: number) => {
      for (let i = 0; i < 10; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10 - 5,
          life: 100,
        });
      }
    }, []);

    // Check collisions
    useEffect(() => {
      items.forEach((item) => {
        if (!item.collected) {
          const distance = Math.sqrt(
            Math.pow(item.x - cartPosition.x, 2) + Math.pow(item.y - (cartPosition.y - 30), 2)
          );

          if (distance < 40) {
            addCollectionParticles(item.x, item.y);
            if (onItemCollect) {
              onItemCollect(item);
            }
          }
        }
      });
    }, [items, cartPosition, addCollectionParticles, onItemCollect]);

    useEffect(() => {
      if (Platform.OS !== 'web' || !canvasRef.current) return;

      // Start animation loop
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [animate]);

    // Fallback for non-web platforms
    if (Platform.OS !== 'web') {
      return <View style={[styles.container, { width, height }]} />;
    }

    return (
      <View style={[styles.container, { width, height }]}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none', // Prevent default touch behavior
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default HTML5CanvasRenderer;
