import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        bengali: ['Noto Sans Bengali', 'Arial', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      lineHeight: {
        bengali: '1.7', // BRD §3.2.5 — matra diacritics require min 1.7
      },
    },
  },
  plugins: [],
} satisfies Config;
