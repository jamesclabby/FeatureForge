/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic background colors using CSS variables
        background: {
          base: 'rgb(var(--bg-base) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
          overlay: 'rgb(var(--bg-overlay) / <alpha-value>)',
        },
        // Semantic text colors
        foreground: {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        // Semantic border colors
        border: {
          DEFAULT: 'rgb(var(--border-default) / <alpha-value>)',
          muted: 'rgb(var(--border-muted) / <alpha-value>)',
        },
        // Functional colors
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          50: 'rgb(var(--color-error) / 0.1)',
          100: 'rgb(var(--color-error) / 0.2)',
          500: 'rgb(var(--color-error) / 1)',
          600: 'rgb(var(--color-error) / 0.9)',
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          50: 'rgb(var(--color-warning) / 0.1)',
          100: 'rgb(var(--color-warning) / 0.2)',
          500: 'rgb(var(--color-warning) / 1)',
          600: 'rgb(var(--color-warning) / 0.9)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          50: 'rgb(var(--color-success) / 0.1)',
          100: 'rgb(var(--color-success) / 0.2)',
          500: 'rgb(var(--color-success) / 1)',
          600: 'rgb(var(--color-success) / 0.9)',
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          50: 'rgb(var(--color-info) / 0.1)',
          100: 'rgb(var(--color-info) / 0.2)',
          500: 'rgb(var(--color-info) / 1)',
          600: 'rgb(var(--color-info) / 0.9)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          50: 'rgb(var(--color-accent) / 0.1)',
          100: 'rgb(var(--color-accent) / 0.2)',
          500: 'rgb(var(--color-accent) / 1)',
          600: 'rgb(var(--color-accent) / 0.9)',
        },
        // Ring color for focus states
        ring: {
          DEFAULT: 'rgb(var(--ring-color) / <alpha-value>)',
        },
        // Legacy color scales (kept for compatibility during migration)
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
        'none': 'none',
      },
    },
  },
  plugins: [],
}
