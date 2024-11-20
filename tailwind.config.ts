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
      fontSize: {
        // Headings
        'heading-1-desktop': ['3.5rem', { lineHeight: '1.2' }], // 56px
        'heading-1-mobile': ['2.5rem', { lineHeight: '1.2' }],  // 40px
        'heading-2-desktop': ['3rem', { lineHeight: '1.2' }],   // 48px
        'heading-2-mobile': ['2.25rem', { lineHeight: '1.2' }], // 36px
        'heading-3-desktop': ['2.5rem', { lineHeight: '1.2' }], // 40px
        'heading-3-mobile': ['2rem', { lineHeight: '1.2' }],    // 32px
        'heading-4-desktop': ['2rem', { lineHeight: '1.3' }],   // 32px
        'heading-4-mobile': ['1.5rem', { lineHeight: '1.4' }],  // 24px
        'heading-5-desktop': ['1.5rem', { lineHeight: '1.4' }], // 24px
        'heading-5-mobile': ['1.25rem', { lineHeight: '1.4' }], // 20px
        'heading-6-desktop': ['1.25rem', { lineHeight: '1.4' }],// 20px
        'heading-6-mobile': ['1.125rem', { lineHeight: '1.4' }], // 18px

        // Text Styles
        'text-large': ['1.25rem', { lineHeight: '1.5' }], // 20px
        'text-medium': ['1.125rem', { lineHeight: '1.5' }], // 18px
        'text-regular': ['1rem', { lineHeight: '1.5' }], // 16px
        'text-small': ['0.875rem', { lineHeight: '1.5' }], // 14px
        'text-extra-small': ['0.75rem', { lineHeight: '1.5' }], // 12px
      },
      fontWeight: {
        regular: '400',
        semiBold: '600',
        bold: '700',
        extraBold: '800'
      },

      colors: {
        primary: "#b54653",      // ראשי
        secondary: "#eac4c7",    // משני
        highlight: "#8C5A5F",    // הדגשה
        strongText: "#3C3E5F",   // טקסט חזק
        weakText: "#CCCCCC",     // טקסט חלש מאוד
        mutedText: "#667085",    // טקסט חלש
      }
    },
  },

  
  plugins: [
    require('daisyui'),
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
