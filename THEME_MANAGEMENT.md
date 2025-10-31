# Theme Management System

## Overview

The admin can now customize color palettes for each event category (מוזיקה, סטנדאפ, תיאטרון, ספורט, ילדים) through a dedicated admin interface.

## Features

### 🎨 Color Customization

Each category has three customizable colors:

- **Primary**: Main buttons and emphasized text
- **Secondary**: Backgrounds and secondary elements
- **Highlight**: Hover states and accents

### 🔍 Live Preview

- Toggle "תצוגה מקדימה" to see colors applied in real-time
- Combined preview shows how colors work together
- Interactive button preview with hover effects

### 💾 Persistence

- Colors are saved to Firebase (`settings/categoryThemes` document)
- Changes apply to all users immediately
- Can reset to default colors at any time

## How to Use

### Accessing the Theme Manager

1. Login as admin
2. Go to `/Admin` page
3. Click "🎨 ניהול צבעי קטגוריות" button
4. Or navigate directly to `/manage-themes`

### Editing Colors

1. **Select Category**: Click on category tabs (מוזיקה, סטנדאפ, etc.)
2. **Choose Colors**: Use color picker or enter HEX codes
3. **Preview**: Enable "תצוגה מקדימה" to see changes live
4. **Save**: Click "💾 שמור שינויים" to apply to all users

### Color Input Methods

- **Color Picker**: Click the colored square to open visual picker
- **HEX Input**: Type color code directly (e.g., #B54653)
- **Preview Boxes**: See how each color looks individually and combined

### Reset to Defaults

Click "🔄 אפס לברירת מחדל" to restore original color scheme for all categories.

## Default Color Palettes

### מוזיקה (Music) - Red/Pink

- Primary: `#B54653`
- Secondary: `#EAC4C7`
- Highlight: `#8C5A5F`

### סטנדאפ (Stand-up) - Blue

- Primary: `#355C88`
- Secondary: `#CEDBF2`
- Highlight: `#20344B`

### תיאטרון (Theater) - Brown

- Primary: `#6F4B3E`
- Secondary: `#D9C7BB`
- Highlight: `#3C2F28`

### ספורט (Sport) - Green

- Primary: `#4B9762`
- Secondary: `#C7E3CF`
- Highlight: `#306C46`

### ילדים (Kids) - Purple

- Primary: `#B18FCF`
- Secondary: `#E1DAF5`
- Highlight: `#6D5198`

## Technical Details

### File Structure

```
app/
  manage-themes/
    page.tsx              # Theme management interface
  theme/
    categoryThemes.ts     # Theme definitions and logic
  Admin/
    page.tsx             # Link to theme manager
```

### Firebase Storage

Colors are stored in Firestore:

```
Collection: settings
Document: categoryThemes
Fields:
  - themes: Object with category themes
  - updatedAt: ISO timestamp
```

### How Themes Work

1. **Loading**: Themes load from Firebase on page load
2. **Fallback**: Uses default themes if Firebase unavailable
3. **Application**: CSS variables set on `:root` element
4. **Dynamic**: Colors change when category is selected

### CSS Variables

```css
--color-primary: [category primary color]
--color-secondary: [category secondary color]
--color-highlight: [category highlight color]
```

Components use these variables via Tailwind classes:

- `bg-primary`, `text-primary`
- `bg-secondary`, `text-secondary`
- `bg-highlight`, `text-highlight`

## Best Practices

### Color Selection

- ✅ Use high contrast colors for accessibility
- ✅ Test colors with preview mode
- ✅ Maintain brand consistency
- ⚠️ Avoid similar colors between categories
- ⚠️ Ensure text remains readable on colored backgrounds

### Before Making Changes

1. Take note of current colors (screenshot recommended)
2. Test with preview mode first
3. Consider impact on all users
4. Save changes during low-traffic times

### Troubleshooting

**Colors not applying?**

- Check Firebase connection
- Clear browser cache
- Verify colors saved in Firebase Console
- Check browser console for errors

**Preview not working?**

- Make sure toggle is enabled
- Select a category first
- Try refreshing the page

**Lost custom colors?**

- Check Firebase Console → Firestore → settings/categoryThemes
- Colors are stored there permanently
- Use "אפס לברירת מחדל" only if you want to discard custom colors

## Future Enhancements

Potential features to add:

- [ ] Color history/undo
- [ ] A/B testing different color schemes
- [ ] Export/import color palettes
- [ ] Predefined color schemes library
- [ ] Accessibility score for color combinations
- [ ] Preview on actual event cards

## Security

- ⚠️ Only admin users can access `/manage-themes`
- ✅ Protected by `AdminProtection` component
- ✅ Changes require confirmation dialog
- ✅ All changes logged with timestamp

## Support

For issues or questions:

1. Check Firebase Console for saved themes
2. Review browser console for errors
3. Verify admin permissions
4. Test with default themes first
