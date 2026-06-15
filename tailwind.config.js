/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        msys: {
          green:     '#3A8C4E',
          'green-d': '#2D6E3E',
          'green-l': '#EBF5EE',
          'green-m': '#C2E0CB',
          amber:     '#E07A2F',
          'amber-l': '#FEF3E2',
          'amber-d': '#A0601A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
