/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whimsy: {
          pink: '#F6DCE5',
          'pink-dark': '#ECAEC2',
          lavender: '#DDD5F5',
          'lavender-dark': '#C2B3EB',
          butter: '#FFF0B8',
          'butter-dark': '#FFE07D',
          mint: '#D8EBDD',
          'mint-dark': '#AED6B8',
          blue: '#DCEBFA',
          'blue-dark': '#B5D8F6',
          cream: '#FFF9F0',
          'cream-dark': '#F5E6D3',
          text: '#51465A',
          'text-muted': '#7B6F85',
        }
      },
      fontFamily: {
        handwritten: ['"Caveat"', 'cursive'],
        display: ['"Quicksand"', '"Fredoka"', 'sans-serif'],
        sans: ['"Quicksand"', '"Nunito"', 'sans-serif'],
        retro: ['"VT323"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(81, 70, 90, 0.08)',
        'soft-lg': '0 14px 40px rgba(81, 70, 90, 0.12)',
        'pastel': '0 10px 25px -5px rgba(221, 213, 245, 0.5)',
        'convex': 'inset 0 0 40px rgba(0,0,0,0.25), 0 15px 35px rgba(81,70,90,0.15)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(3deg)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(10px) rotate(-3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        shutterFlash: {
          '0%': { opacity: '0' },
          '30%': { opacity: '0.95' },
          '100%': { opacity: '0' }
        }
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        'float-reverse': 'float-reverse 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        flash: 'shutterFlash 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}
