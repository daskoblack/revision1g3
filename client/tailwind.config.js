/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50:  '#EEF2FA',
          100: '#D5DFEF',
          200: '#A8BADE',
          500: '#1C3461',
          700: '#142649',
          900: '#0F1B35',
        },
        parchment: {
          50:  '#FDFCFA',
          100: '#F7F3ED',
          200: '#EDE6D9',
          300: '#DDD2BC',
        },
        amber: {
          300: '#E8B96A',
          400: '#D4924A',
          600: '#B5751E',
          800: '#7C4D0E',
          900: '#4A2E07',
        },
        ink: {
          DEFAULT: '#2C2C3E',
          light:   '#6B6880',
          pale:    '#9B98A8',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15,27,53,0.08), 0 1px 2px -1px rgba(15,27,53,0.06)',
        'card-hover': '0 4px 12px 0 rgba(15,27,53,0.12), 0 2px 4px -1px rgba(15,27,53,0.08)',
        'soft': '0 2px 8px 0 rgba(15,27,53,0.06)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#2C2C3E',
            a: { color: '#B5751E' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
