/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1600px',
    },
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'Noto Sans Arabic', 'Noto Sans SC', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Nunito', 'Noto Sans Arabic', 'Noto Sans SC', 'Nunito Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'typo-h1': ['2rem', { lineHeight: '1.2' }],
        'typo-h1-lg': ['3rem', { lineHeight: '1.2' }],
        'typo-h2': ['1.5rem', { lineHeight: '1.3' }],
        'typo-h2-lg': ['2rem', { lineHeight: '1.3' }],
        'typo-h3': ['1.25rem', { lineHeight: '1.35' }],
        'typo-h3-lg': ['1.5rem', { lineHeight: '1.35' }],
        'typo-body': ['0.875rem', { lineHeight: '1.6' }],
        'typo-body-lg': ['1rem', { lineHeight: '1.6' }],
        'typo-body-xl': ['1rem', { lineHeight: '1.6' }],
        'typo-body-xl-lg': ['1.125rem', { lineHeight: '1.6' }],
        'typo-small': ['0.75rem', { lineHeight: '1.5' }],
        'typo-small-lg': ['0.875rem', { lineHeight: '1.5' }],
        'typo-btn': ['0.875rem', { lineHeight: '1.2' }],
        'typo-caption': ['0.75rem', { lineHeight: '1.4' }],
        'typo-caption-lg': ['0.8125rem', { lineHeight: '1.4' }],
      },
      fontWeight: {
        'typo-regular': '400',
        'typo-medium': '500',
        'typo-semibold': '600',
        'typo-bold': '700',
        'typo-extrabold': '800',
      },
      colors: {
        pink: {
          primary: '#E75480',
          soft: '#FADADD',
          dark: '#C2185B',
          bg: '#FFF7FA',
        },
        gold: '#F4B400',
        text: '#1F1F1F',
      },
      boxShadow: {
        'pink-soft': '0 4px 14px 0 rgba(231, 84, 128, 0.15)',
        'pink-glow': '0 0 20px rgba(231, 84, 128, 0.3)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'modal-in': 'modalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'blob-float': 'blobFloat 25s ease-in-out infinite',
        'blob-breathe': 'blobBreathe 28s ease-in-out infinite',
        'letter-float': 'letterFloat 24s ease-in-out infinite',
        'hero-float': 'heroFloat 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -12px, 0)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(-8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        blobFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '25%': { transform: 'translateY(-3%) scale(1.02)' },
          '50%': { transform: 'translateY(2%) scale(0.98)' },
          '75%': { transform: 'translateY(-2%) scale(1.01)' },
        },
        blobBreathe: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(0, 2%, 0) scale(1.03)' },
          '66%': { transform: 'translate3d(0, -2%, 0) scale(0.97)' },
        },
        letterFloat: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg) scale(1)' },
          '25%': { transform: 'translate3d(0, -8px, 0) rotate(2deg) scale(1.02)' },
          '50%': { transform: 'translate3d(0, 4px, 0) rotate(-1deg) scale(0.98)' },
          '75%': { transform: 'translate3d(0, -4px, 0) rotate(1deg) scale(1.01)' },
        },
        heroFloat: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -8px, 0)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
