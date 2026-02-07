/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#f8fafc',
        surface: '#ffffff',
      }
    },
  },
  plugins: [require('tailwindcss-primeui')],
}
