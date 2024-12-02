import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Uniswap 风格的颜色
        pink: {
          400: '#FF49DB',
          500: '#FF007A',
        },
        slate: {
          ...colors.slate,
          900: '#0D111C',
          800: '#131A2A',
          700: '#1B2236',
        },
      },
      backgroundColor: {
        'primary': '#FF007A',
        'primary-dark': '#FF49DB',
      },
      textColor: {
        'primary': '#FF007A',
        'primary-dark': '#FF49DB',
      },
      borderColor: {
        'primary': '#FF007A',
        'primary-dark': '#FF49DB',
      },
    },
  },
  plugins: [],
}

export default config
