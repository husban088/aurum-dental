/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./src/**/*.{html,ts}'],
  // Same breakpoints as the original layout so nothing shifts: 576 / 768 / 992 / 1200 / 1400
  theme: {
    screens: { sm: '576px', md: '768px', lg: '992px', xl: '1200px', '2xl': '1400px' },
    extend: {
      colors: {
        ink: '#0A1F44',
        ink2: '#123A7A',
        ink3: '#0C2A5E',
        royal: '#2563EB',
        glow: '#1D4FB8',
        sky: '#DCE9FF',
        mist: '#EAF1FD',
        pearl: '#FAFBFF',
        gold: '#C9A24E',
        gold2: '#EBD08E',
        rose: '#D46A7A',
        muted: '#5b6b8a',
        edge: '#cfdcf2',
        dash: '#EFF4FC',
        line: '#dee2e6',
        danger: '#dc3545',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ["'Cormorant Garamond'", 'Georgia', 'serif'],
      },
      transitionTimingFunction: { DEFAULT: 'ease' },
      backgroundImage: {
        'gold-shine': 'linear-gradient(120deg,#C9A24E,#EBD08E,#C9A24E)',
        'hero-glow': 'radial-gradient(ellipse at 75% 40%,#1D4FB8 0,#0A1F44 62%)',
        'page-glow': 'radial-gradient(ellipse at 80% 0,#1D4FB8 0,#0A1F44 70%)',
        'card-fade': 'linear-gradient(180deg,#fff,#EAF1FD)',
        'bar-line': 'linear-gradient(90deg,#2563EB,#EBD08E)',
        'orb-blue': 'linear-gradient(145deg,#2563EB,#123A7A)',
        'orb-ink': 'linear-gradient(145deg,#123A7A,#0A1F44)',
        'orb-gold': 'linear-gradient(145deg,#C9A24E,#a9832f)',
        'band-ink': 'linear-gradient(135deg,#0A1F44,#123A7A)',
        'band-blue': 'linear-gradient(135deg,#2563EB,#123A7A)',
        'side-ink': 'linear-gradient(180deg,#0A1F44,#0C2A5E)',
        'gate-glow': 'radial-gradient(ellipse at 70% 20%,#1D4FB8 0,#0A1F44 65%)',
        'doc-frame': 'conic-gradient(from 200deg,#123A7A,#2563EB,#DCE9FF,#123A7A)',
        'doc-over': 'linear-gradient(transparent,rgba(10,31,68,.95))',
        'bar-col': 'linear-gradient(#2563EB,#123A7A)',
        'orb-shine': 'radial-gradient(#DCE9FF,transparent 70%)',
        'select-arrow':
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e\")",
        'field-bad':
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e\")",
        'field-ok':
          "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='M2.3 6.73.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e\")",
      },
      boxShadow: {
        frame: '0 0 0 5px #FAFBFF,0 0 0 7px #C9A24E,0 24px 50px rgba(10,31,68,.2)',
        'frame-ba': '0 0 0 5px #FAFBFF,0 0 0 7px #C9A24E,0 26px 60px rgba(10,31,68,.22)',
        'lift-blue': '0 20px 40px rgba(37,99,235,.15)',
        'lift-why': '0 26px 50px rgba(37,99,235,.18)',
        'lift-rev': '0 28px 60px rgba(37,99,235,.16)',
        'lift-ink': '0 24px 50px rgba(10,31,68,.12)',
        lux: '0 30px 70px rgba(10,31,68,.12)',
        gold: '0 10px 30px rgba(201,162,78,.45)',
      },
      keyframes: {
        draw: { to: { strokeDashoffset: '0' } },
        fillin: { to: { fill: 'rgba(250,251,255,.95)' } },
      },
      animation: {
        'spin-slow': 'spin 40s linear infinite',
        tooth: 'draw 3s ease forwards, fillin 1.6s 2.4s ease forwards',
      },
    },
  },
  // We build our own container (same widths/padding as the original 12px-gutter container)
  corePlugins: { container: false },
  plugins: [
    plugin(function ({ addComponents }) {
      addComponents({
        '.container': {
          width: '100%',
          paddingLeft: '.75rem',
          paddingRight: '.75rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          '@media (min-width: 576px)': { maxWidth: '540px' },
          '@media (min-width: 768px)': { maxWidth: '720px' },
          '@media (min-width: 992px)': { maxWidth: '960px' },
          '@media (min-width: 1200px)': { maxWidth: '1140px' },
          '@media (min-width: 1400px)': { maxWidth: '1320px' },
        },
      });
    }),
  ],
};
