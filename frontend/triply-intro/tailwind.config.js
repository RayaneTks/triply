const libPreset = require('triply-docs-lib/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {

    presets: [libPreset],

    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './app/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
        './node_modules/triply-docs-lib/dist/**/*.{js,mjs,cjs,jsx}'
    ],

    theme: {
        extend: {
            backgroundImage: {
                'page-background': "url('/background.webp')",
            },
            blur: {
                'page': '8px',
            }
        },
    },

    plugins: [],
}