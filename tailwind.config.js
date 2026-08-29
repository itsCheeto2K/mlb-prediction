/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mlb: {
          blue: '#002D72',
          red: '#D50032',
          dark: '#0B132B',
          card: '#1C2541',
          surface: '#111B33',
          border: '#3A506B',
          accent: '#00F0FF',
          gold: '#FFD700',
          green: '#10B981',
          danger: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
