/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // ── Impeccable.style Design Tokens ──────────────────────────
    // Color Palette: Natural farm tones with accessible contrast
    colors: {
      // Primary — Forest Green (brand)
      primary: {
        50:  '#f0fdf4', // lightest tint
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // base
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d', // darkest shade
      },
      // Neutral — Warm Gray
      gray: {
        50:  '#fafaf9', // warm white
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917', // near black
      },
      // Semantic
      success: {
        light: '#dcfce7',
        DEFAULT: '#22c55e',
        dark: '#15803d',
      },
      warning: {
        light: '#fef9c3',
        DEFAULT: '#eab308',
        dark: '#a16207',
      },
      danger: {
        light: '#fee2e2',
        DEFAULT: '#ef4444',
        dark: '#b91c1c',
      },
      info: {
        light: '#dbeafe',
        DEFAULT: '#3b82f6',
        dark: '#1d4ed8',
      },
    },

    // Typography Scale — consistent, harmonious sizes
    fontSize: {
      '2xs':  ['0.625rem',  { lineHeight: '0.875rem', letterSpacing: '0.01em' }],  // 10px
      'xs':   ['0.75rem',   { lineHeight: '1rem',     letterSpacing: '0.01em' }],  // 12px
      'sm':   ['0.875rem',  { lineHeight: '1.375rem', letterSpacing: '0' }],      // 14px
      'base': ['1rem',      { lineHeight: '1.625rem', letterSpacing: '0' }],      // 16px
      'lg':   ['1.125rem',  { lineHeight: '1.75rem',  letterSpacing: '-0.01em' }], // 18px
      'xl':   ['1.25rem',   { lineHeight: '1.875rem', letterSpacing: '-0.02em' }], // 20px
      '2xl':  ['1.5rem',    { lineHeight: '2rem',     letterSpacing: '-0.02em' }], // 24px
      '3xl':  ['1.875rem',  { lineHeight: '2.25rem',  letterSpacing: '-0.03em' }], // 30px
      '4xl':  ['2.25rem',   { lineHeight: '2.5rem',   letterSpacing: '-0.03em' }], // 36px
    },

    // Spacing System — 4px base grid
    spacing: {
      '0':    '0',
      '0.5':  '0.125rem', // 2px
      '1':    '0.25rem',  // 4px
      '1.5':  '0.375rem', // 6px
      '2':    '0.5rem',   // 8px
      '2.5':  '0.625rem', // 10px
      '3':    '0.75rem',  // 12px
      '3.5':  '0.875rem', // 14px
      '4':    '1rem',     // 16px
      '5':    '1.25rem',  // 20px
      '6':    '1.5rem',   // 24px
      '7':    '1.75rem',  // 28px
      '8':    '2rem',     // 32px
      '9':    '2.25rem',  // 36px
      '10':   '2.5rem',   // 40px
      '12':   '3rem',     // 48px
      '14':   '3.5rem',   // 56px
      '16':   '4rem',     // 64px
      '20':   '5rem',     // 80px
    },

    // Border Radius — cohesive rounding
    borderRadius: {
      'none': '0',
      'sm':   '0.25rem',  // 4px
      'DEFAULT': '0.375rem', // 6px
      'md':   '0.5rem',   // 8px
      'lg':   '0.75rem',  // 12px
      'xl':   '1rem',     // 16px
      '2xl':  '1.5rem',   // 24px
      'full': '9999px',
    },

    // Shadows — purposeful, not overwhelming
    boxShadow: {
      'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'sm':  '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      'DEFAULT': '0 2px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      'md':  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      'lg':  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      'xl':  '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
    },

    // Font Family
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    },

    // Transition
    transitionDuration: {
      DEFAULT: '150ms',
    },
    transitionTimingFunction: {
      DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    extend: {},
  },
  plugins: [],
}
