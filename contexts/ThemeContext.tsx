import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ColorScheme, ThemeColors } from '@/constants/colors';

const THEME_STORAGE_KEY = '@app/theme_preference';

export const [ThemeContext, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme() as ColorScheme;
  const [themePreference, setThemePreference] = useState<ColorScheme | 'system'>('system');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeColorScheme: ColorScheme = 
    themePreference === 'system' ? (systemColorScheme || 'light') : themePreference;

  const colors: ThemeColors = Colors[activeColorScheme];

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        setThemePreference(saved as ColorScheme | 'system');
      }
    } catch (error) {
      console.error('[THEME] Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = useCallback(async (preference: ColorScheme | 'system') => {
    try {
      setThemePreference(preference);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
      console.log(`[THEME] Theme preference set to: ${preference}`);
    } catch (error) {
      console.error('[THEME] Error saving theme preference:', error);
    }
  }, []);

  return {
    colors,
    colorScheme: activeColorScheme,
    themePreference,
    setTheme,
    isLoading,
    isDark: activeColorScheme === 'dark',
  };
});
