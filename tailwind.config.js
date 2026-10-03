/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        lime: 'rgb(var(--lime) / <alpha-value>)',
        ember: 'rgb(var(--ember) / <alpha-value>)',
        ice: 'rgb(var(--ice) / <alpha-value>)',
        onlime: 'rgb(var(--onlime) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Arial Narrow"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      borderRadius: { card: '10px' },
      boxShadow: { glow: '0 0 24px -4px rgb(var(--lime) / 0.45)', ember: '0 0 24px -4px rgb(var(--ember) / 0.45)' },
    },
  },
  plugins: [],
}
