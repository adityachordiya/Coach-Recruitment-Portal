/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#A51C30',
          dark: '#8B1626',
          light: '#C0253D',
          50: '#FDF2F4',
          100: '#FAE4E8',
        },
        gold: {
          DEFAULT: '#D4A017',
          dark: '#B8890F',
          light: '#E8B420',
          50: '#FDF9EE',
          100: '#FAF1CC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
