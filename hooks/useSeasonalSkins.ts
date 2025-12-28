import { useState, useEffect } from 'react';
import { getCurrentSeasonalEvents, isWithinEventPeriod } from '../config/seasonalEvents';

export interface SeasonalSkin {
  id: string;
  name: string;
  type: 'flag' | 'shape' | 'trail';
  rarity: string;
  season: string;
  asset: string;
  description: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  unlock: string;
  available?: boolean;
}

export const useSeasonalSkins = () => {
  const [activeSeasonalSkins, setActiveSeasonalSkins] = useState<SeasonalSkin[]>([]);
  const [currentEvents, setCurrentEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSeasonalSkins = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current seasonal events
        const events = getCurrentSeasonalEvents();
        setCurrentEvents(events);

        // Load all skins data
        const allSkins = await loadAllSkins();

        // Filter for seasonal skins that are currently active
        const seasonalSkins = allSkins.filter((skin) => {
          // Check if skin is seasonal and has a season field
          if (skin.rarity !== 'seasonal' || !skin.season) {
            return false;
          }

          // Check if the season is currently active
          return isWithinEventPeriod(skin.season as any);
        });

        setActiveSeasonalSkins(seasonalSkins);
      } catch (err) {
        console.error('Error loading seasonal skins:', err);
        setError('Failed to load seasonal skins');
      } finally {
        setIsLoading(false);
      }
    };

    loadSeasonalSkins();
  }, []);

  // Helper function to load all skins (simplified version)
  const loadAllSkins = async (): Promise<SeasonalSkin[]> => {
    try {
      // In a real app, this would load from the config file
      // For now, we'll return a mock list of seasonal skins
      const seasonalSkins: SeasonalSkin[] = [
        {
          id: 'georgia_bhm',
          name: 'Black History Trail (GA)',
          type: 'trail',
          rarity: 'seasonal',
          season: 'black_history_month',
          asset: 'trails/bhm_georgia_trail.png',
          description: 'Celebrate Black History Month with Georgia',
          theme: {
            primaryColor: '#1F2937',
            secondaryColor: '#374151',
            accentColor: '#F59E0B',
          },
          unlock: 'Play during February',
          available: true,
        },
        {
          id: 'texas_hispanic',
          name: 'Hispanic Heritage Flag (TX)',
          type: 'flag',
          rarity: 'seasonal',
          season: 'hispanic_heritage',
          asset: 'flags/hispanic_texas_flag.png',
          description: 'Honor Hispanic Heritage in Texas',
          theme: {
            primaryColor: '#DC2626',
            secondaryColor: '#EF4444',
            accentColor: '#F59E0B',
          },
          unlock: 'Play during Hispanic Heritage Month',
          available: true,
        },
        {
          id: 'california_hispanic',
          name: 'Hispanic Heritage Shape (CA)',
          type: 'shape',
          rarity: 'seasonal',
          season: 'hispanic_heritage',
          asset: 'shapes/hispanic_california_shape.png',
          description: 'Celebrate Hispanic Heritage in California',
          theme: {
            primaryColor: '#1E40AF',
            secondaryColor: '#3B82F6',
            accentColor: '#F59E0B',
          },
          unlock: 'Play during Hispanic Heritage Month',
          available: true,
        },
        {
          id: 'alaska_winter',
          name: 'Winter Wonderland (AK)',
          type: 'trail',
          rarity: 'seasonal',
          season: 'winter_holidays',
          asset: 'trails/winter_alaska_trail.png',
          description: "Experience Alaska's winter magic",
          theme: {
            primaryColor: '#1E293B',
            secondaryColor: '#475569',
            accentColor: '#E2E8F0',
          },
          unlock: 'Play during Winter Holidays',
          available: true,
        },
        {
          id: 'vermont_fall',
          name: 'Autumn Maple (VT)',
          type: 'shape',
          rarity: 'seasonal',
          season: 'thanksgiving',
          asset: 'shapes/autumn_vermont_shape.png',
          description: "Vermont's beautiful autumn colors",
          theme: {
            primaryColor: '#92400E',
            secondaryColor: '#F59E0B',
            accentColor: '#DC2626',
          },
          unlock: 'Play during Thanksgiving',
          available: true,
        },
        {
          id: 'hawaii_summer',
          name: 'Summer Paradise (HI)',
          type: 'trail',
          rarity: 'seasonal',
          season: 'summer_solstice',
          asset: 'trails/summer_hawaii_trail.png',
          description: "Hawaii's summer paradise",
          theme: {
            primaryColor: '#059669',
            secondaryColor: '#10B981',
            accentColor: '#F59E0B',
          },
          unlock: 'Play during Summer Solstice',
          available: true,
        },
        {
          id: 'california_pride',
          name: 'Pride Celebration (CA)',
          type: 'flag',
          rarity: 'seasonal',
          season: 'pride_month',
          asset: 'flags/pride_california_flag.png',
          description: 'Celebrate Pride Month in California',
          theme: {
            primaryColor: '#7C3AED',
            secondaryColor: '#A855F7',
            accentColor: '#EC4899',
          },
          unlock: 'Play during Pride Month',
          available: true,
        },
        {
          id: 'new_york_independence',
          name: 'Independence Stars (NY)',
          type: 'shape',
          rarity: 'seasonal',
          season: 'independence_day',
          asset: 'shapes/independence_ny_shape.png',
          description: 'Celebrate Independence Day in New York',
          theme: {
            primaryColor: '#DC2626',
            secondaryColor: '#1E40AF',
            accentColor: '#FFFFFF',
          },
          unlock: 'Play during Independence Day',
          available: true,
        },
      ];

      return seasonalSkins;
    } catch (error) {
      console.error('Error loading skins:', error);
      return [];
    }
  };

  // Get skins by specific event
  const getSkinsByEvent = (eventId: string): SeasonalSkin[] => {
    return activeSeasonalSkins.filter((skin) => skin.season === eventId);
  };

  // Get skins by type
  const getSkinsByType = (type: 'flag' | 'shape' | 'trail'): SeasonalSkin[] => {
    return activeSeasonalSkins.filter((skin) => skin.type === type);
  };

  // Check if a specific skin is currently available
  const isSkinCurrentlyAvailable = (skinId: string): boolean => {
    return activeSeasonalSkins.some((skin) => skin.id === skinId);
  };

  // Get count of available seasonal skins
  const getAvailableCount = (): number => {
    return activeSeasonalSkins.length;
  };

  // Get upcoming seasonal skins (for preview)
  const getUpcomingSkins = async (): Promise<SeasonalSkin[]> => {
    try {
      const allSkins = await loadAllSkins();
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      return allSkins.filter((skin) => {
        if (skin.rarity !== 'seasonal' || !skin.season) return false;

        // Check if the skin will be available next month
        const nextMonthEvents = getCurrentSeasonalEvents(nextMonth);
        return nextMonthEvents.includes(skin.season as any);
      });
    } catch (error) {
      console.error('Error loading upcoming skins:', error);
      return [];
    }
  };

  return {
    activeSeasonalSkins,
    currentEvents,
    isLoading,
    error,
    getSkinsByEvent,
    getSkinsByType,
    isSkinCurrentlyAvailable,
    getAvailableCount,
    getUpcomingSkins,
    refresh: () => {
      // Trigger a refresh of seasonal skins
      setActiveSeasonalSkins([]);
      setCurrentEvents([]);
      setIsLoading(true);
      setError(null);
    },
  };
};
