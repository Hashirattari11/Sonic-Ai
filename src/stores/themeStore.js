import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: true,
      accentColor: '#00d4ff',
      
      toggleTheme: () => {
        set((state) => {
          const newIsDark = !state.isDark;
          document.documentElement.classList.toggle('light', !newIsDark);
          document.documentElement.classList.toggle('dark', newIsDark);
          return { isDark: newIsDark };
        });
      },
      
      setTheme: (isDark) => {
        document.documentElement.classList.toggle('light', !isDark);
        document.documentElement.classList.toggle('dark', isDark);
        set({ isDark });
      },
      
      setAccentColor: (color) => {
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-glow', color + '33');
        set({ accentColor: color });
      },
      
      initTheme: () => {
        const stored = localStorage.getItem('sonic-theme');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.isDark !== undefined) {
            document.documentElement.classList.toggle('light', !state.isDark);
            document.documentElement.classList.toggle('dark', state.isDark);
            set({ isDark: state.isDark });
          }
          if (state?.accentColor) {
            document.documentElement.style.setProperty('--accent', state.accentColor);
            document.documentElement.style.setProperty('--accent-glow', state.accentColor + '33');
            set({ accentColor: state.accentColor });
          }
        }
      },
    }),
    {
      name: 'sonic-theme',
    }
  )
);