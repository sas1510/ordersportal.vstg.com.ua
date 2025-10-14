/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
   extend: {
      colors: {
        'custom-green': '#76b448',
        'custom-green-dark': '#5f9037', // колір для hover
      },
    },
  },
  plugins: [],
}
