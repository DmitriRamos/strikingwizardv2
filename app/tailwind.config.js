/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#edfaf1',
          100: '#d4f3dc',
          200: '#a9e7ba',
          300: '#7ddb97',
          400: '#57b17b',
          500: '#57b17b',
          600: '#469963',
          700: '#35724a',
          800: '#234c32',
          900: '#122619',
        },
        background: {
          dark: '#0f0f0f',
          DEFAULT: '#171717',
          light: '#262626',
        },
        surface: {
          DEFAULT: '#1e1e1e',
          light: '#2a2a2a',
        },
        text: {
          DEFAULT: '#fafafa',
          muted: '#a3a3a3',
        },
      },
    },
  },
  plugins: [],
};
