/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        sidebar: {
          DEFAULT: '#1e293b',
          hover: '#334155',
          active: '#0f172a',
          border: '#334155',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
        'soft-lg': '0 10px 25px rgba(0,0,0,0.08)',
        'card': '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'card': '0.75rem',
        'input': '0.5rem',
        'btn': '0.5rem',
      },
    },
  },
  plugins: [],
};
