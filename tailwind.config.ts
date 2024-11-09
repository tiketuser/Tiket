import type { Config } from "tailwindcss";
const colors = require('tailwindcss/colors')

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'selection-red': {
          primary: '#b54653',
          secondary: '#eac4c7',
          metal: "#52525b",
        },
      },
      fontFamily: {
        'rubik': ["Medium 500"]
      }
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#b54653",
          "secondary": "#eac4c7",
          "metal": "#52525b",
        },
      }
    ]
  }
};
export default config;
