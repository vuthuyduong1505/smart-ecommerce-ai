/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#d70018',
          hoverRed: '#b70014',
          dark: '#1e293b',
          muted: '#64748b',
          bg: '#f4f6f8'
        }
      }
    },
  },
  plugins: [],
}

