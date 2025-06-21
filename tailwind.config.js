/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gorbagana: {
          primary: '#8B5CF6',
          secondary: '#A78BFA',
          accent: '#C4B5FD',
          dark: '#1F2937',
          darker: '#111827',
          light: '#F3F4F6',
        },
        blockchain: {
          green: '#10B981',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          orange: '#F59E0B',
        }
      },
      backgroundImage: {
        'gorbagana-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)',
        'blockchain-gradient': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #8B5CF6, 0 0 10px #8B5CF6, 0 0 15px #8B5CF6' },
          '100%': { boxShadow: '0 0 10px #8B5CF6, 0 0 20px #8B5CF6, 0 0 30px #8B5CF6' },
        }
      }
    },
  },
  plugins: [],
} 