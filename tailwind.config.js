/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui"

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'sit-image': "url('../assets/SIT_INVEST.png')",
      },
    },
  },
  plugins: [
    daisyui,
  ],
}

