/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}', // Adjust to match your project structure
  ],
  presets: [require('nativewind/preset')], // Add this line
  theme: {
    extend: {},
  },
  plugins: [],
};