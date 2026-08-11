/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F2A4A',
        orange: '#F5821F',
        slate: '#3D4A5C',
      },
    },
  },
  plugins: [],
}
