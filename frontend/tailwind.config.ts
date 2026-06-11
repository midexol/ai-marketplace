import type { Config } from 'tailwindcss';

/**
 * Palette: "Graphite & Amber".
 * The legacy class names (slate / cyan / blue / sky) are remapped here to a
 * warm neutral + amber accent so the whole app recolors from one place.
 * To re-theme, change the `cyan`/`blue` ramps (accent) or `slate` ramp (neutral).
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm neutral graphite (replaces cold blue-slate)
        slate: {
          100: '#f5f3ee',
          200: '#e9e6df',
          300: '#cfccc3',
          400: '#9a958b',
          500: '#6f6b62',
          600: '#46433d',
          700: '#2c2a26',
          800: '#1b1a17',
          900: '#121110',
        },
        // Amber accent (replaces cyan)
        cyan: {
          100: '#fdf0d2',
          200: '#fbe1a4',
          300: '#f6cd72',
          400: '#eeb446',
          500: '#e09c20',
          600: '#c07e12',
          700: '#97620f',
        },
        // Bronze (gradient partner, replaces blue)
        blue: {
          300: '#f0c468',
          400: '#dd9a25',
          500: '#bd7c12',
          600: '#945e0c',
        },
        sky: {
          400: '#eeb446',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
