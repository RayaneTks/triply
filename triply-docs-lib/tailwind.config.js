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
          DEFAULT: '#35C497',
          light: '#50D4AA',
          dark: '#006241',
        },
        secondary: {
          DEFAULT: '#F5E6CA',
          light: '#FFF3DF',
          dark: '#DCC6A2',
        },
        neutral: '#64748b',
      },
    },
  },
  plugins: [],
}
