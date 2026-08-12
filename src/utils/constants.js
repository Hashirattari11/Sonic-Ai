export const APP_NAME = 'Sonic AI';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'AI Voice Assistant inspired by J.A.R.V.I.S.';
export const DEVELOPER = 'Hashir Attari';

export const ROUTES = {
  LOGIN: '/',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  HISTORY: '/history',
  SETTINGS: '/settings',
};

export const THEME_STORAGE_KEY = 'sonic-theme';
export const AUTH_STORAGE_KEY = 'sonic-auth';
export const CHAT_STORAGE_KEY = 'sonic-chat';
export const GEMINI_API_KEY_STORAGE = 'sonic-gemini-key';
export const GEMINI_API_STATUS_STORAGE = 'sonic-gemini-status';

export const ACCENT_COLORS = [
  { name: 'Cyan', value: '#00d4ff' },
  { name: 'Purple', value: '#7b2ff7' },
  { name: 'Green', value: '#00ff88' },
  { name: 'Orange', value: '#ffaa00' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
];

export const SYSTEM_STATS = {
  cpuUsage: '23%',
  memoryUsed: '6.2 GB',
  memoryTotal: '16 GB',
  networkStatus: 'Online',
  ping: '12ms',
  apiLatency: '45ms',
  cores: 8,
  cpuSpeed: '3.2GHz',
};