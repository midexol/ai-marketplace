import type { Config } from 'tailwindcss';

/**
 * "Editorial Terminal" — warm stone neutrals + a single clay accent.
 * Legacy class names (slate / cyan / blue / sky / indigo) all map to the warm
 * stone ramp so the UI is cohesively warm-neutral; the clay accent is applied
 * deliberately via CSS component classes (.btn-primary, .eyebrow) — never sprayed.
 */
const STONE = {
  100: '#f6f2ea',
  200: '#e8e1d3',
  300: '#cdc5b4',
  400: '#a39a88',
  500: '#7a7160',
  600: '#564e41',
  700: '#3a352c',
  800: '#252017',
  900: '#1a160f',
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
        slate: STONE,
        cyan: STONE,
        blue: STONE,
        indigo: STONE,
        sky: STONE,
        clay: {
          400: '#d98064',
          500: '#c96a4d',
          600: '#b3573b',
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
