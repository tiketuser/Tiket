// Generate PWA icons
// Run: node generate-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [192, 512];
const colors = {
  background: '#6366f1',
  text: '#ffffff'
};

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = colors.text;
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', size / 2, size / 2);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}x${size}.png`, buffer);
  console.log(`Generated icon-${size}x${size}.png`);
});

console.log('Icons generated successfully!');
