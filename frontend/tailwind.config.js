/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand colour — deep navy blue (professional fintech feel)
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#1e40af',
          600: '#1d3a9e',
          700: '#1e3a8a',
          900: '#1e2d5c',
        },
        // Accent — warm gold (represents money/value)
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Status colours
        success: '#10b981',
        warning: '#f59e0b',
        danger:  '#ef4444',
      },
      fontFamily: {
        // DM Sans — clean, modern, used by many fintech apps
        sans:    ['DM Sans', 'sans-serif'],
        // DM Mono — for numbers, loan amounts, scores
        mono:    ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};