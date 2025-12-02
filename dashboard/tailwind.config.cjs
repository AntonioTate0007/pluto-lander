/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'pluto-bg': '#0a0b10',
        'pluto-panel': '#12141c',
        'pluto-card': '#181a24',
        'pluto-border': '#252836',
        'pluto-accent': '#f5a623',
        'pluto-accent-soft': '#ffc966',
        'pluto-green': '#22c55e',
        'pluto-red': '#ef4444',
        'pluto-blue': '#3b82f6',
        'pluto-purple': '#a855f7',
      },
      fontFamily: {
        'sans': ['Outfit', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'pluto': '0 18px 40px rgba(0,0,0,0.6)',
        'pluto-sm': '0 4px 12px rgba(0,0,0,0.4)',
        'glow-accent': '0 0 20px rgba(245, 166, 35, 0.2)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
