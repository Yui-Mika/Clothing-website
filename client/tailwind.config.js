/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        primary:"#f4f4f4",
        primaryDeep:"#1b1b1726",
        secondary:"#777777",
        tertiary:"#272626",
        gray: {
          30: "#7b7b7b",
          50: "585858",
        },
      },
      screens: {
        xs: "400px"
      },
      backgroundImage: {
        hero: "url(/src/assets/bg.png)",
      },
      fontFamily: {
        paci: ['"Pacifico"', 'cursive'],
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
        'ping': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'bounce': 'bounce 1s infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}