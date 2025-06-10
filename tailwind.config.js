/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  extend: {
    animation: {
      'glow-orange': 'glow-orange 10s ease-out forwards',
      'blink': 'blink 1s ease-in-out 10',
    },
    keyframes: {
      'glow-orange': {
        '0%': { boxShadow: '0 0 10px 3px rgba(255, 165, 0, 0.7)' },
        '100%': { boxShadow: '0 0 0 0 rgba(255, 165, 0, 0)' },
      },
      'blink': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.4' },
      },
    },
  },
},
  plugins: [],
};
