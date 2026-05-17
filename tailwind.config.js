/** @type {import('tailwindcss').Config} */
module.exports = {
  content:[
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
        },
        secondary: {
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
        }
      }
    },
  },
  plugins:[],
}