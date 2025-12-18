/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'selector', // THIS FIXES THE ISSUE by forcing class-based toggling
  theme: {
    extend: {},
  },
  plugins: [],
}