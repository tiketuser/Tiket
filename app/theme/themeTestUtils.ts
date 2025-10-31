// Theme Testing Utility
// Use this in browser console to test theme switching

import { applyTheme, categoryThemes, getTheme } from './categoryThemes';

// Test all themes sequentially
export const testAllThemes = () => {
  const categories = Object.keys(categoryThemes);
  let index = 0;
  
  console.log('🎨 Testing all category themes...');
  
  const interval = setInterval(() => {
    if (index >= categories.length) {
      console.log('✅ Theme testing complete! Resetting to default...');
      applyTheme(null);
      clearInterval(interval);
      return;
    }
    
    const category = categories[index];
    const theme = getTheme(category);
    console.log(`\n${category}:`, theme);
    applyTheme(category);
    
    index++;
  }, 2000); // Change theme every 2 seconds
};

// Test specific theme
export const testTheme = (category: string) => {
  const theme = getTheme(category);
  console.log(`🎨 Applying ${category} theme:`, theme);
  applyTheme(category);
};

// Reset to default
export const resetTheme = () => {
  console.log('🔄 Resetting to default theme (Music)');
  applyTheme(null);
};

// Display all available themes
export const showThemes = () => {
  console.log('🎨 Available themes:');
  Object.entries(categoryThemes).forEach(([category, theme]) => {
    console.log(`\n${category}:`, theme);
  });
};

// Usage examples:
// testAllThemes() - cycles through all themes
// testTheme('ספורט') - test sport theme
// resetTheme() - back to default
// showThemes() - list all themes
