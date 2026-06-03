/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Helixona brand gold (#d6b981) with derived tints/shades.
        brand: {
          50: '#faf7f0',
          100: '#f3ebd9',
          200: '#e8d7b4',
          300: '#dfc699',
          400: '#d9bf8d',
          500: '#d6b981',
          600: '#c2a163',
          700: '#9c7e44',
          800: '#7c6537',
          900: '#66532f',
        },
        // Near-black scale for the sidebar / dark surfaces.
        ink: {
          600: '#2b2b2b',
          700: '#1c1c1c',
          800: '#111111',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
