/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          gold: '#EAB308',
          neon: '#EAB308',
          dark: '#0a0a0a',
          zinc: '#18181b',
        }
      },
      boxShadow: {
        'neon-gold': '0 0 15px rgba(234, 179, 8, 0.4)',
        'neon-gold-lg': '0 0 25px rgba(234, 179, 8, 0.5)',
      }
    },
  },
  plugins: [],
}
