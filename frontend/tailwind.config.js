/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'sans-serif'],
      },
      colors: {
        // Override blue palette → Royal Blue theme (#2B3DE8)
        blue: {
          50:  '#EEF0FD',
          100: '#D5D9FB',
          200: '#ABB3F7',
          300: '#808EF3',
          400: '#5668EF',
          500: '#3348E6',
          600: '#2B3DE8',
          700: '#2233CC',
          800: '#1A29B0',
          900: '#121E8F',
          950: '#0D1578',
        },
        // Teal accent
        teal: {
          400: '#4ECDC4',
          500: '#3BBDB5',
        },
        // Gold accent
        gold: {
          400: '#F0C050',
          500: '#DBA830',
        },
      },
    },
  },
  plugins: [],
}
