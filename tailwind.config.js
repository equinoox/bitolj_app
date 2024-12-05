/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#D6E0F0',
        secondary: '#393B44',
        secondary_dark: '#22313f',
        orange: '#FFA001',
        text_color_1: '#393B44',
        text_color_2: '#F1F3F8',
      }
    },
  },
  plugins: [],
}

