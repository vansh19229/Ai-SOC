import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'soc-bg': '#0a0e1a',
        'soc-surface': '#0d1117',
        'soc-card': '#161b27',
        'soc-border': '#1e2739',
        'neon-green': '#00ff88',
        'soc-text': '#e2e8f0',
        'soc-muted': '#8892a4',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #ef4444, 0 0 10px #ef4444' },
          '100%': { boxShadow: '0 0 20px #ef4444, 0 0 40px #ef4444' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
