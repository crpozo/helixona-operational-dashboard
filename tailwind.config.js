/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec4ff',
          400: '#59a3ff',
          500: '#327dff',
          600: '#1a5cf5',
          700: '#1547e1',
          800: '#173bb6',
          900: '#19388f',
        },
        ink: {
          900: '#0b1220',
          800: '#111a2e',
          700: '#1b2742',
          600: '#273553',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
