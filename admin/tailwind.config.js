/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          sidebar: '#14171A',
          'sidebar-hover': '#1E2328',
          'sidebar-active': '#262D34',
          accent: '#2F6F68',
          'accent-hover': '#245953',
          'accent-light': '#E8F2F0',
          bg: '#F8F9FA',
          card: '#FFFFFF',
          border: '#E2E8F0',
          dark: '#0F172A',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
