/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#F6F8FC',
          surface: '#FFFFFF',
          secondary: '#F0F4FA',
        },
        brand: {
          navy: '#14213D',
          indigo: '#4F46E5',
          indigoHover: '#4338CA',
          softIndigo: '#EEF2FF',
          teal: '#0D9488',
          softTeal: '#CCFBF1',
        },
        text: {
          primary: '#172033',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        border: {
          light: '#E2E8F0',
          strong: '#CBD5E1',
        },
        semantic: {
          success: '#15803D',
          successBg: '#DCFCE7',
          warning: '#B45309',
          warningBg: '#FEF3C7',
          danger: '#DC2626',
          dangerBg: '#FEE2E2',
          info: '#2563EB',
          infoBg: '#DBEAFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
