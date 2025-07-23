import { useState, useRef, useCallback, useEffect } from 'react';
import { Dimensions } from 'react-native';
import GamePhysics from '../utils/physics';

const { width } = Dimensions.get('window');

interface GameObject {
  id: string;
  x: number;
  y: number;
  type: 'coin' | 'bonus' | 'powerup';
  powerUpType?: 'magnet' | 'slowMotion' | 'doublePoints' | 'goldRush';
  value: number;
  speed: number;
}

interface SpawnConfig {
  spawnInterval: number;
  gameSpeed: number;
  isGameActive: boolean;
}

export const useSpawnCoins = (config: SpawnConfig) => {
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const spawnTimerRef = useRef<NodeJS.Timeout>();

  const spawnObject = useCallback(() => {
    if (!config.isGameActive) return;

    const newObject: GameObject = {
      id: Date.now().toString(),
      x: Math.random() * (width - 40),
      y: -50,
      type: Math.random() < 0.1 ? 'powerup' : Math.random() < 0.2 ? 'bonus' : 'coin',
      value: GamePhysics.calculateCoinValue(),
      speed: 2 + Math.random() * 2
    };

    if (newObject.type === 'powerup') {
      const powerUpType = GamePhysics.generatePowerUp();
      if (powerUpType) {
        newObject.powerUpType = powerUpType;
      }
    }

    setGameObjects(prev => [...prev, newObject]);
  }, [config.isGameActive]);

  const updateObjects = useCallback((deltaTime: number) => {
    setGameObjects(prev => 
      prev.map(obj => ({
        ...obj,
        y: obj.y + obj.speed * config.gameSpeed
      })).filter(obj => obj.y < 1000) // Remove off-screen objects
    );
  }, [config.gameSpeed]);

  const removeObject = useCallback((objectId: string) => {
    setGameObjects(prev => prev.filter(obj => obj.id !== objectId));
  }, []);

  const clearAllObjects = useCallback(() => {
    setGameObjects([]);
  }, []);

  useEffect(() => {
    if (config.isGameActive) {
      spawnTimerRef.current = setInterval(spawnObject, config.spawnInterval);
    } else {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
    }

    return () => {
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
    };
  }, [config.isGameActive, config.spawnInterval, spawnObject]);

  return {
    gameObjects,
    updateObjects,
    removeObject,
    clearAllObjects,
  };
}; 