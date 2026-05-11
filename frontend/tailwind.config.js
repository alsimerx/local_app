/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont',
          '"SF Pro Text"', '"SF Pro Display"', '"SF Pro"',
          '"Helvetica Neue"', '"Segoe UI"', 'Roboto',
          '"Sukhumvit Set"', '"Thonburi"', '"Noto Sans Thai"', '"Leelawadee UI"',
          'system-ui', 'sans-serif',
        ],
      },
      colors: {
        'el-pink':  '#ff2e7e',
        'el-cyan':  '#00e0ff',
        'el-amber': '#ffd23f',
        'el-ink':   '#0a0d2e',
        'el-ink2':  '#1a1f4a',
        'el-muted': '#6b7390',
        'el-line':  '#e8eaf3',
        'el-soft':  '#f5f6fb',
      },
    },
  },
  plugins: [],
}
