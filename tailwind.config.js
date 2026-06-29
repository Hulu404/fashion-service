/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Pink + blue palette — mirrors the CSS variables in app/globals.css.
        oat: '#F7E1EA',
        porcelain: '#FBEFF4',
        'porcelain-2': '#FEF8FB',
        ink: '#1E2A52',
        'ink-soft': '#3C4C7E',
        stone: '#8690B4',
        mocha: '#4E66B0',
        'mocha-soft': '#AEC0E8',
        oxblood: '#C43B72',
        'oxblood-deep': '#A12C5C'
      },
      boxShadow: {
        eclat: '0 24px 60px -28px rgba(30,25,60,.5)'
      },
      borderRadius: {
        e: '16px',
        button: '2px'
      }
    }
  },
  plugins: []
}
