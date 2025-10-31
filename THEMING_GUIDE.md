# Category Theming System

## Overview

The website dynamically changes its color palette based on the selected category on the homepage. Each category (Music, Stand-up, Theater, Sport, Kids) has its own unique color scheme.

## How It Works

### 1. Theme Configuration (`app/theme/categoryThemes.ts`)

All category themes are defined in a single configuration file. Each theme has three colors:

- **Primary**: Main brand color for buttons, headings, highlights
- **Secondary**: Light background color for cards, sections
- **Highlight**: Darker accent color for hover states, active elements

### 2. CSS Variables (`app/globals.css`)

The theme colors are applied using CSS variables:

- `--color-primary`
- `--color-secondary`
- `--color-highlight`

These variables are referenced in `tailwind.config.ts` and automatically update when a category is selected.

### 3. Theme Application (`applyTheme` function)

When a user selects a category, the `applyTheme()` function updates the CSS variables on the document root, triggering smooth color transitions across the entire website.

## Current Color Schemes

### מוזיקה (Music) - Default

- Primary: `#7C3AED` (Purple)
- Secondary: `#F3E8FF` (Light Purple)
- Highlight: `#5B21B6` (Dark Purple)

### סטנדאפ (Stand-up)

- Primary: `#355C88` (Blue)
- Secondary: `#CEDBF2` (Light Blue)
- Highlight: `#20344B` (Dark Blue)

### תיאטרון (Theater)

- Primary: `#6F4B3E` (Brown)
- Secondary: `#D9C7BB` (Light Brown)
- Highlight: `#3C2F28` (Dark Brown)

### ספורט (Sport)

- Primary: `#4B9762` (Green)
- Secondary: `#C7E3CF` (Light Green)
- Highlight: `#306C46` (Dark Green)

### ילדים (Kids)

- Primary: `#B18FCF` (Light Purple)
- Secondary: `#E1DAF5` (Very Light Purple)
- Highlight: `#6D5198` (Medium Purple)

## How to Add or Modify Themes

### Adding a New Category

1. Open `app/theme/categoryThemes.ts`
2. Add a new entry to the `categoryThemes` object:

```typescript
export const categoryThemes: Record<string, CategoryTheme> = {
  // ... existing themes
  "קטגוריה חדשה": {
    primary: "#HEXCODE",
    secondary: "#HEXCODE",
    highlight: "#HEXCODE",
  },
};
```

### Modifying Existing Colors

1. Open `app/theme/categoryThemes.ts`
2. Find the category you want to modify
3. Update the color hex codes
4. Changes take effect immediately - no additional configuration needed!

### Changing the Default Theme

To change which theme is used when no category is selected:

1. Open `app/theme/categoryThemes.ts`
2. Modify the `defaultTheme` export:

```typescript
export const defaultTheme: CategoryTheme = categoryThemes["קטגוריה רצויה"];
```

## Technical Details

### File Structure

```
app/
 theme/
    categoryThemes.ts       # Theme definitions and logic
 components/
    Gallery/
        Gallery.tsx          # Applies themes on category selection
 globals.css                  # CSS variables and transitions
 tailwind.config.ts          # References CSS variables
```

### Key Functions

- `applyTheme(category: string | null)` - Applies theme to document
- `getTheme(category: string | null)` - Returns theme object for a category

### Transition Effects

Color transitions are smooth (0.3s ease-in-out) and apply to:

- Background colors
- Border colors
- Text colors
- SVG fills and strokes

## Themed SVG Components

The hero section uses dynamically themed SVG components that automatically update their colors based on the selected category. These are inline SVG components (not image files) that reference CSS variables.

### Location

`app/components/HeroSection/ThemedSVGs.tsx`

### How It Works

Instead of using static SVG files, we use React components that render inline SVGs with `fill="var(--color-primary)"`, `fill="var(--color-secondary)"`, etc. This allows the SVG colors to dynamically change when the theme changes.

### Adding New Themed SVGs

1. Convert your SVG file to a React component
2. Replace hardcoded color values with CSS variables:
   - Primary color: `fill="var(--color-primary)"`
   - Secondary color: `fill="var(--color-secondary)"`
   - Highlight color: `fill="var(--color-highlight)"`
3. Keep structural colors (black, white, etc.) as-is
4. Export the component from `ThemedSVGs.tsx`
5. Import and use it like a regular React component

### Example

```tsx
export const MyThemedSVG = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="var(--color-primary)" />
    <circle cx="50" cy="50" r="20" fill="var(--color-secondary)" />
  </svg>
);
```

## Browser Support

This system uses CSS custom properties (CSS variables), which are supported by all modern browsers:

- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

## Notes

- The database still uses "concerts" collection name (not affected by theming)
- Themes only affect visual styling, not functionality
- All Tailwind classes using `primary`, `secondary`, or `highlight` automatically update
- SVGs in the hero section dynamically change colors with the theme
- Regular image-based SVGs won't change colors; use inline SVG components for dynamic theming
