/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#f8fafc',
          900: '#ffffff',
          850: '#f1f5f9',
          800: '#e2e8f0',
          750: '#cbd5e1',
          700: '#94a3b8',
          600: '#64748b',
          500: '#475569',
          400: '#334155',
          300: '#1e293b',
          200: '#0f172a',
          100: '#020617',
          50: '#ffffff',
        },
        safety: {
          cyan: '#0284c7',
          'cyan-glow': '#0369a1',
          amber: '#d97706',
          'amber-glow': '#b45309',
          emerald: '#059669',
          'emerald-glow': '#047857',
          rose: '#e11d48',
          'rose-glow': '#be123c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'], // Map mono to regular sans-serif to ensure no blocky mono fonts appear!
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
