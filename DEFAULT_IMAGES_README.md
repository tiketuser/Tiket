# Default Category Images System

This system provides automatic fallback images for events based on their category when no custom image is uploaded.

## Features

### 1. Automatic Default Images

When creating a new event in the Admin panel, if no image is uploaded:

- The system automatically uses a default image for that event's category
- Each category (מוזיקה, תיאטרון, סטנדאפ, ילדים, ספורט) has its own default image
- Ensures all events always have a visual representation

### 2. Admin Management Interface

A dedicated page at `/manage-default-images` allows administrators to:

- View current default images for all categories
- Upload new default images for any category
- Update existing default images at any time
- Preview images before they're used

### 3. Fallback System

If no default image is set for a category:

- A color-coded SVG placeholder is generated automatically
- Uses the category's theme colors for consistency
- Displays the category name in Hebrew

## File Structure

```
app/
 theme/
    defaultCategoryImages.ts       # Core logic and Firestore integration
 Admin/
    page.tsx                       # Updated to use default images
 manage-default-images/
     page.tsx                       # Admin interface for managing defaults
```

## Database Schema

### Collection: `defaultCategoryImages`

```typescript
{
  category: string,           // "מוזיקה" | "תיאטרון" | "סטנדאפ" | "ילדים" | "ספורט"
  imageData: string,          // Base64 encoded image
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Usage

### For Event Creation

In the Admin page (`/Admin`):

1. Fill in event details (name, category, date, time, venue)
2. **Optionally** upload a custom image
3. If no image is uploaded, the system uses the category's default
4. Submit the form

### For Managing Defaults

In the manage default images page (`/manage-default-images`):

1. View current default images for all categories
2. Click "העלה תמונה חדשה" for any category
3. Select an image file (JPG, PNG, or WEBP, max 5MB)
4. Image is automatically uploaded and saved
5. Future events without custom images will use the new default

## API Functions

### `getDefaultCategoryImage(category: string): Promise<string>`

- Fetches the default image for a category
- Returns base64 image data
- Falls back to SVG placeholder if none exists

### `updateDefaultCategoryImage(category: string, imageData: string): Promise<void>`

- Updates or creates a default image for a category
- Saves to Firestore
- Automatically updates timestamp

### `FALLBACK_IMAGE_SVG(category: string): string`

- Generates a themed SVG placeholder
- Uses category colors from the theme system
- Returns data URI ready for use in `<img>` src

## Implementation Details

### Image Validation

- Accepted formats: JPEG, JPG, PNG, WEBP
- Maximum file size: 5MB
- Images stored as base64 in Firestore

### Error Handling

- Falls back to SVG if Firestore fails
- User-friendly error messages
- Loading states during uploads

### Performance

- Images cached in component state
- Lazy loading on demand
- Base64 reduces external requests

## Benefits

1. **No Broken Images**: Events always have visuals
2. **Consistency**: Category-themed fallbacks maintain design language
3. **Flexibility**: Admins can customize defaults anytime
4. **User Experience**: Faster event creation (image optional)
5. **Scalability**: Centralized image management

## Future Enhancements

Potential improvements:

- Image cropping/resizing tool in upload interface
- Multiple default images per category (random selection)
- AI-generated category-appropriate images
- Bulk upload for multiple categories
- Image optimization/compression
- CDN integration for better performance
