import type { Config } from 'tailwindcss';

const config: Config = {
 content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}", // Ensure this covers all your extensions
],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        primary: {
          50: '#f4fce7',
          100: '#eefacb',
          200: '#dff5a3',
          300: '#c5eb6e',
          400: '#a6db36',
          500: '#7bb508',
          600: '#609105',
          700: '#4a7004',
          800: '#3d5907',
          900: '#344b0b',
        },
        secondary: {
          50: '#f0f1f5',
          100: '#dee0e8',
          200: '#c4c8d8',
          300: '#9ea5c3',
          400: '#737da8',
          500: '#525e8c',
          600: '#1B234F',
          700: '#161c3f',
          800: '#10152f',
          900: '#0b0e1f',
        },
        brand: {
          navy: '#1B234F',
          green: '#7bb508',
          bg: '#FAFAFB',
        },
      },
    },
  },
  plugins: [],
};

export default config;
