/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true, // This adds !important to all Tailwind utilities
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // wtf is this
  plugins: [require("@tailwindcss/typography")],
};
