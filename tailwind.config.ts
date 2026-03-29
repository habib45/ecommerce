import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary = blue-600 — change this one line to re-theme the whole UI
        primary: colors.blue,
      },
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
