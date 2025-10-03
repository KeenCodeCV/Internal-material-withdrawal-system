/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'neon-bg': '#0b0f1f',
        'neon-card': '#121735',
        'neon-accent': '#7c5cff'
      },
      boxShadow: {
        'soft': '0 10px 30px rgba(0,0,0,.35)'
      },
      borderRadius: {
        '2xl': '1rem'
      }
    }
  },
  plugins: []
};