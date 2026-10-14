/** @type {import('tailwindcss').Config} */
// Ascend palette (2026-10 redesign): brand red for action and urgency, ink
// for structure, navy for quiet accents, warm neutrals for the page. `gold`
// is kept for the few places that celebrate (earnings, badges), toned down.
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#BD1F2E',
          dark: '#8A1621',
          light: '#D23646',
          50: '#FDF3F4',
          100: '#FBE4E6',
          200: '#F4C3C8',
        },
        ink: {
          DEFAULT: '#15171B',
          soft: '#2A2D34',
          muted: '#5B606B',
        },
        navy: {
          DEFAULT: '#1F3A5F',
          light: '#2E5486',
          50: '#F0F4F9',
          100: '#DEE6F0',
        },
        paper: '#F6F5F2',
        gold: {
          DEFAULT: '#B8892B',
          dark: '#946C1C',
          light: '#D4A63F',
          50: '#FBF7EE',
          100: '#F4EAD2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,23,27,0.04), 0 1px 3px rgba(21,23,27,0.04)',
        lift: '0 8px 24px -8px rgba(21,23,27,0.18), 0 2px 6px -2px rgba(21,23,27,0.08)',
      },
    },
  },
  plugins: [],
};
