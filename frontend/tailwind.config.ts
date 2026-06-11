import type { Config } from 'tailwindcss';

/**
 * "Editorial Terminal" — warm stone neutrals + a single clay accent.
 * Legacy class names (slate / cyan / blue / sky / indigo) all map to the warm
 * stone ramp so the UI is cohesively warm-neutral; the clay accent is applied
 * deliberately via CSS component classes (.btn-primary, .eyebrow) — never sprayed.
 */
const CARAMEL = {
  100: '#fff7df',
  200: '#ffe8ad',
  300: '#ffd166',
  400: '#ffb640',
  500: '#f59e1b',
  600: '#c87510',
  700: '#76501d',
  800: '#30200c',
  900: '#130f08',
};

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: CARAMEL,
        cyan: CARAMEL,
        blue: CARAMEL,
        indigo: CARAMEL,
        sky: CARAMEL,
        clay: {
          400: '#ffb640',
          500: '#f59e1b',
          600: '#c87510',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
