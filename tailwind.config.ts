import type { Config } from "tailwindcss";
const colors = require('tailwindcss/colors')

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
		screens: {
			'md-lg': '1000px', // Custom breakpoint between md (768px) and lg (1024px)
		  },
  		fontSize: {
  			'heading-1-desktop': ['3.5rem', { lineHeight: '1.2' }],
  			'heading-1-mobile': ['2.5rem', { lineHeight: '1.2' }],
  			'heading-2-desktop': ['3rem', { lineHeight: '1.2' }],
  			'heading-2-mobile': ['2.25rem', { lineHeight: '1.2' }],
  			'heading-3-desktop': ['2.5rem', { lineHeight: '1.2' }],
  			'heading-3-mobile': ['2rem', { lineHeight: '1.2' }],
  			'heading-4-desktop': ['2rem', { lineHeight: '1.3' }],
  			'heading-4-mobile': ['1.5rem', { lineHeight: '1.4' }],
  			'heading-5-desktop': ['1.5rem', { lineHeight: '1.4' }],
  			'heading-5-mobile': ['1.25rem', { lineHeight: '1.4' }],
  			'heading-6-desktop': ['1.25rem', { lineHeight: '1.4' }],
  			'heading-6-mobile': ['1.125rem', { lineHeight: '1.4' }],
  			'text-large': ['1.25rem', { lineHeight: '1.5' }],
  			'text-medium': ['1.125rem', { lineHeight: '1.5' }],
  			'text-regular': ['1rem', { lineHeight: '1.5' }],
  			'text-small': ['0.875rem', { lineHeight: '1.5' }],
  			'text-extra-small': ['0.75rem', { lineHeight: '1.5' }]
  		},
  		fontWeight: {
  			regular: '400',
  			semiBold: '600',
  			bold: '700',
  			extraBold: '800'
  		},
  		colors: {
			primary: '#B54653',
			secondary: "#EAC4C7",
  			highlight: '#8C5A5F',
  			strongText: '#3C3E5F',
  			weakText: '#CCCCCC',
  			mutedText: '#667085',
  		},
  		boxShadow: {
  			xxsmall: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
  			xsmall: '0px 1px 2px 0px rgba(0, 0, 0, 0.06), 0px 1px 3px 0px rgba(0, 0, 0, 0.1)',
  			small: '0px 2px 4px -2px rgba(0, 0, 0, 0.06), 0px 4px 8px -2px rgba(0, 0, 0, 0.1)',
  			medium: '0px 4px 6px -2px rgba(0, 0, 0, 0.03), 0px 12px 16px -4px rgba(0, 0, 0, 0.08)',
  			large: '0px 8px 8px -4px rgba(0, 0, 0, 0.03), 0px 20px 24px -4px rgba(0, 0, 0, 0.08)',
  			xlarge: '0px 24px 48px -12px rgba(0, 0, 0, 0.18)',
  			xxlarge: '0px 32px 64px -12px rgba(0, 0, 0, 0.14)',
  			'xxsmall-inner': '0px 1px 4px 0px rgba(0, 0, 0, 0.05) inset',
  			'xsmall-inner': '0px 1px 2px 0px rgba(0, 0, 0, 0.06) inset, 0px 1px 3px 0px rgba(0, 0, 0, 0.1) inset',
  			'small-inner': '0px 2px 4px -2px rgba(0, 0, 0, 0.06) inset, 0px 4px 8px -2px rgba(0, 0, 0, 0.1) inset',
  			'medium-inner': '0px 4px 6px -2px rgba(0, 0, 0, 0.03) inset, 0px 12px 16px -4px rgba(0, 0, 0, 0.08) inset',
  			'large-inner': '0px 8px 8px -4px rgba(0, 0, 0, 0.03) inset, 0px 20px 20px -4px rgba(0, 0, 0, 0.08) inset',
  			'xlarge-inner': '0px 24px 48px -12px rgba(0, 0, 0, 0.18) inset',
  			'xxlarge-inner': '0px 32px 64px -12px rgba(0, 0, 0, 0.14) inset'
  		},
  	}
  },

  
  plugins: [
    require('daisyui'),
      require("tailwindcss-animate")
],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#b54653",      // ראשי
          secondary: "#eac4c7",    // משני
          highlight: "#8C5A5F",    // הדגשה
          strongText: "#3C3E5F",   // טקסט חזק
          weakText: "#CCCCCC",     // טקסט חלש מאוד
          mutedText: "#667085",    // טקסט חלש
        },
      }
    ]
  }
};
export default config;
