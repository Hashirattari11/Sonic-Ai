/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a0e1a',
          light: '#0f1629',
        },
        secondary: {
          DEFAULT: '#0f1629',
          light: '#1a2338',
        },
        glass: 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        accent: {
          DEFAULT: '#00d4ff',
          glow: 'rgba(0, 212, 255, 0.2)',
          secondary: '#7b2ff7',
        },
        text: {
          primary: '#e8f4fd',
          secondary: '#8899aa',
        },
        success: '#00ff88',
        danger: '#ff4466',
        warning: '#ffaa00',
        light: {
          bg: '#f0f4f8',
          card: '#ffffff',
          border: '#e2e8f0',
          text: '#1e293b',
          muted: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
        'accent-glow': 'radial-gradient(circle at center, rgba(0,212,255,0.3) 0%, transparent 70%)',
      },
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 64px 0 rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(123, 47, 247, 0.2)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.4), 0 0 80px rgba(123, 47, 247, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.1)',
      },
      borderRadius: {
        'glass': '16px',
        'glass-lg': '24px',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-ring-slow': 'pulse-ring 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.3)', opacity: '0.1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(123, 47, 247, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.5), 0 0 80px rgba(123, 47, 247, 0.4)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      scrollbar: {
        'thin': '4px',
        'track': 'transparent',
        'thumb': 'rgba(0, 212, 255, 0.3)',
        'thumb-hover': 'rgba(0, 212, 255, 0.6)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 212, 255, 0.3) transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '4px',
          height: '4px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 212, 255, 0.3)',
          borderRadius: '2px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0, 212, 255, 0.6)',
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        '.glass-dark': {
          background: 'rgba(15, 22, 41, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
        '.glass-card': {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        '.glass-card-hover': {
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        '.glass-card-hover:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 16px 64px 0 rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 212, 255, 0.1)',
          borderColor: 'rgba(0, 212, 255, 0.2)',
        },
        '.btn-primary': {
          background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
          border: 'none',
          color: '#0a0e1a',
          fontWeight: '600',
          padding: '12px 24px',
          borderRadius: '12px',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
        },
        '.btn-primary:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 8px 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(123, 47, 247, 0.3)',
        },
        '.btn-primary:active': {
          transform: 'scale(0.98)',
        },
        '.btn-ghost': {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#e8f4fd',
          padding: '10px 20px',
          borderRadius: '10px',
          transition: 'all 0.2s ease',
        },
        '.btn-ghost:hover': {
          background: 'rgba(0, 212, 255, 0.1)',
          borderColor: 'rgba(0, 212, 255, 0.3)',
        },
        '.input-field': {
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#e8f4fd',
          padding: '12px 16px',
          borderRadius: '10px',
          width: '100%',
          transition: 'all 0.2s ease',
          outline: 'none',
        },
        '.input-field:focus': {
          borderColor: '#00d4ff',
          boxShadow: '0 0 0 3px rgba(0, 212, 255, 0.1)',
        },
        '.input-field::placeholder': {
          color: '#8899aa',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #00d4ff 0%, #7b2ff7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.orb-glow': {
          position: 'relative',
        },
        '.orb-glow::before': {
          content: '""',
          position: 'absolute',
          inset: '-20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(0,212,255,0.3) 0%, transparent 70%)',
          animation: 'pulse-ring 3s ease-in-out infinite',
          zIndex: '-1',
        },
        '.orb-glow::after': {
          content: '""',
          position: 'absolute',
          inset: '-40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(123,47,247,0.15) 0%, transparent 70%)',
          animation: 'pulse-ring 4s ease-in-out infinite reverse',
          zIndex: '-2',
        },
      };
      addUtilities(newUtilities);
    }
  ],
};