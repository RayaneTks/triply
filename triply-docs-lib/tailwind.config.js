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
          DEFAULT: '#0096c7',
          light: '#ffffff',
          dark: '#222222',
        },
        secondary: {
          DEFAULT: '#DBDBDB',
          light: '#ffffff',
          dark: '#6E6E6E',
        },
        neutral: '#0096c7',
      },
      height: {
        '24': '6rem',
      },
    },
  },
  plugins: [],
}
