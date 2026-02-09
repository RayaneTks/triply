/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    './.storybook/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F8351',
          light: '#74A55D',
          dark: '#296044',
        },
        secondary: {
          DEFAULT: '#DBDBDB',
          light: '#ffffff',
          dark: '#6E6E6E',
        },
        neutral: '#64748b',
      },
      height: {
        '24': '6rem',
      },
    },
  },
  plugins: [],
}
