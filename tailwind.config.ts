import type { Config } from 'tailwindcss';

// Colors are CSS variables (see src/styles/index.css) stored as RGB channels
// so Tailwind opacity modifiers (e.g. bg-accent/20) work.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: token('space-950'),
          900: token('space-900'),
          800: token('space-800'),
          700: token('space-700'),
          600: token('space-600'),
        },
        line: token('line'),
        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
          faint: token('ink-faint'),
        },
        accent: {
          DEFAULT: token('accent'),
          blue: token('accent-blue'),
        },
        status: {
          normal: token('status-normal'),
          attention: token('status-attention'),
          urgent: token('status-urgent'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgb(57 255 20 / 0.03) inset, 0 8px 24px -12px rgb(0 0 0 / 0.7)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'fade-up': 'fade-up 0.35s ease-out both' },
    },
  },
  plugins: [],
} satisfies Config;