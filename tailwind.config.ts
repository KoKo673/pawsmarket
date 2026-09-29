import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * PawsMarket design tokens
 * ─────────────────────────
 * Palette philosophy: warm off-white "paper" surfaces (Apple-esque calm)
 * with a vibrant Paw-Orange CTA color and a Soft-Teal secondary accent.
 * All semantic colors resolve through CSS variables (see src/index.css)
 * so dark mode is a simple `.dark` class swap — no duplicate Tailwind keys.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Semantic tokens (CSS variable driven) ── */
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* ── Brand ramps for non-semantic utility (bg-paw-500, text-tide-600…) ── */
        paw: {
          50: 'hsl(20 100% 97%)',
          100: 'hsl(20 100% 93%)',
          200: 'hsl(20 96% 87%)',
          300: 'hsl(20 96% 78%)',
          400: 'hsl(20 96% 66%)',
          500: 'hsl(20 96% 55%)',
          600: 'hsl(20 96% 48%)',
          700: 'hsl(20 92% 40%)',
          800: 'hsl(20 88% 33%)',
          900: 'hsl(20 84% 28%)',
          950: 'hsl(20 90% 16%)',
        },
        tide: {
          50: 'hsl(172 60% 96%)',
          100: 'hsl(172 55% 90%)',
          200: 'hsl(172 55% 80%)',
          300: 'hsl(172 60% 68%)',
          400: 'hsl(172 66% 54%)',
          500: 'hsl(172 70% 43%)',
          600: 'hsl(172 72% 36%)',
          700: 'hsl(172 70% 30%)',
          800: 'hsl(172 68% 24%)',
          900: 'hsl(172 66% 19%)',
          950: 'hsl(172 70% 12%)',
        },
      },

      fontFamily: {
        /* Premium Persian sans — the global face for fa-IR (RTL) UI */
        sans: ['Vazirmatn', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        /* Same family for display flourishes so no text ever falls back */
        display: ['Vazirmatn', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.75rem',
        '3xl': '2.25rem',
      },

      boxShadow: {
        /* Soft neumorphic depth — theme-aware via CSS variables */
        soft: 'var(--shadow-soft)',
        lifted: 'var(--shadow-lifted)',
        glow: 'var(--shadow-glow)',
        glass: 'var(--shadow-glass)',
      },

      zIndex: {
        /* Above Leaflet's internal panes (which reach z-index 700) */
        nav: '1000',
        drawer: '1100',
        modal: '1200',
        toast: '1300',
      },

      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(2.1)', opacity: '0' },
        },
      },

      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config
