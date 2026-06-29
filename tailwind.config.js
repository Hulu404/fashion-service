/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        oat: '#E9E1D2',
        porcelain: '#F6F1E7',
        'porcelain-2': '#FBF8F1',
        ink: '#221B16',
        'ink-soft': '#4A4038',
        stone: '#9C9183',
        mocha: '#8A6A4F',
        'mocha-soft': '#C7B49F',
        oxblood: '#6E2A38',
        'oxblood-deep': '#561F2B'
      },
      boxShadow: {
        eclat: '0 24px 60px -28px rgba(34,20,12,.55)'
      },
      borderRadius: {
        e: '16px',
        button: '2px'
      }
    }
  },
  plugins: []
}
