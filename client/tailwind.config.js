/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        urban: {
          black: '#111111',
          white: '#FFFFFF',
          teal: '#2F6F68',
          'teal-dark': '#235550',
          'teal-light': '#3D8C83',
          'warm-grey': '#6B6B65',
          'warm-grey-light': '#A1A19B',
          biscuit: '#D8C7AD',
          'biscuit-light': '#EAE1D2',
          'biscuit-dark': '#C2AF93',
          'light-grey': '#F5F5F3',
          border: '#E5E5E2',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        widest: '.2em',
        editorial: '.15em',
      },
    },
  },
  plugins: [],
};
