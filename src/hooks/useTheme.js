import { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

export const useTheme = () => {
  const { isDark, accentColor, toggleTheme, setTheme, setAccentColor, initTheme } = useThemeStore();
  
  useEffect(() => {
    initTheme();
  }, [initTheme]);
  
  const accentColors = [
    { name: 'Cyan', value: '#00d4ff' },
    { name: 'Purple', value: '#7b2ff7' },
    { name: 'Green', value: '#00ff88' },
    { name: 'Orange', value: '#ffaa00' },
  ];
  
  return {
    isDark,
    accentColor,
    toggleTheme,
    setTheme,
    setAccentColor,
    accentColors,
  };
};