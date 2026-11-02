/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'sans-serif'],
      },
      colors: {
        darkbg: '#0C0C0C',
        surface: '#141416',
        'surface-elevated': '#1B1C20',
        'surface-border': '#262830',
      },
    },
  },
  plugins: [],
}
