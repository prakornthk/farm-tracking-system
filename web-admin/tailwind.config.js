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
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        success: '#22c55e',
        warning: '#eab308',
        danger:  '#ef4444',
        info:    '#3b82f6',
      },
      fontSize: {
        '2xs':  ['0.625rem', { lineHeight: '0.875rem' }],
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.375rem' }],
        'base': ['1rem',     { lineHeight: '1.625rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
      },
      borderRadius: {
        sm:    '0.25rem',
        DEFAULT: '0.375rem',
        md:    '0.5rem',
        lg:    '0.75rem',
        xl:    '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        sm:  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        DEFAULT: '0 2px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        md:  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        lg:  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
      fontFamily: {
        sans: ['Kanit', 'Noto Sans Thai', 'Sarabun', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
