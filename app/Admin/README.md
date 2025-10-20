# Admin Panel - Concert Management

## Overview

The Admin panel allows you to create and manage concerts in the system. Each concert can have multiple tickets uploaded by users.

## Access

Navigate to: http://localhost:3000/Admin

Or click "🎭 ניהול קונצרטים" in the navbar dropdown (under "הכרטיסים שלי")

## Features

### 1. Create New Concert

Fill in the form with:

- **Artist Name** (שם האמן) - Required
- **Concert Title** (כותרת הקונצרט) - Required
- **Date** (תאריך) - Format: dd/mm/yyyy (e.g., 25/12/2025)
- **Time** (שעה) - Format: HH:MM (e.g., 20:00)
- **Venue** (מיקום) - Location of the concert
- **Image** (תמונה) - Upload a concert poster/image (JPG, PNG, WEBP)

Click "🎸 צור קונצרט חדש" to create.

### 2. View Existing Concerts

Below the form, you'll see a list of all concerts with:

- Concert image
- Artist name
- Title
- Date, time, venue
- View count
- Status (active/inactive)

### 3. Manage Concerts

- **Delete**: Click the red trash icon to remove a concert
- **View stats**: See how many views each concert has

## Database Structure

### Concert Document

```typescript
{
  artist: string; // Artist name
  title: string; // Concert title
  date: string; // dd/mm/yyyy format
  time: string; // HH:MM format
  venue: string; // Location
  imageData: string; // Base64 image data
  status: string; // "active" or "inactive"
  views: number; // View counter
  createdAt: Timestamp; // Creation date
}
```

## Workflow

### Creating a Concert

1. Fill in all required fields (marked with \*)
2. Upload an image (concert poster)
3. Preview the image before submitting
4. Click create button
5. Concert appears in the list below

### Adding Tickets to Concert

After creating a concert, users can:

1. Go to "העלאת כרטיס" (Upload Ticket)
2. Upload ticket image with OCR
3. The system will match the ticket to existing concerts by:
   - Artist name
   - Date
   - Venue
4. If a match is found, ticket is linked to that concert
5. If no match, a new concert is created automatically

## Validation Rules

### Date Format

- Must be: dd/mm/yyyy
- Example: 25/12/2025
- Validated on submit

### Time Format

- Must be: HH:MM
- Example: 20:00 or 14:30
- Validated on submit

### Image Upload

- Supported formats: JPG, JPEG, PNG, WEBP
- File size: Recommended under 5MB
- Stored as base64 in Firestore

## UI Features

### Form

- Real-time validation
- Image preview before upload
- Clear error messages in Hebrew
- Loading states during submit
- Success/error notifications

### Concert List

- Sorted by creation date (newest first)
- Responsive grid layout
- Hover effects
- Delete confirmation dialog
- Loading spinner while fetching

## Notes

### Image Storage

- Images are stored as base64 strings in Firestore
- No Firebase Storage bucket required
- This keeps all data in one place

### Concert Matching

When users upload tickets:

- System queries concerts by: artist + date + venue
- Exact match required for linking
- Case-sensitive matching
- If no match found, new concert is auto-created

### Permissions

Currently, the Admin page is publicly accessible.

**Recommended**: Add authentication check to restrict access to admin users only.

```typescript
// Add this to page.tsx
useEffect(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== "admin@tiket.com") {
      router.push("/");
    }
  });
}, []);
```

## Future Enhancements

Potential features to add:

- [ ] Edit existing concerts
- [ ] Bulk upload concerts from CSV
- [ ] Concert status toggle (active/inactive)
- [ ] View all tickets for a concert
- [ ] Analytics dashboard
- [ ] Search/filter concerts
- [ ] Duplicate concert detection
- [ ] Image optimization before upload
- [ ] Admin authentication/authorization
- [ ] Audit log for changes

## Troubleshooting

### Concert Not Appearing

- Check browser console for errors
- Verify Firebase connection
- Check Firestore rules allow write access

### Image Upload Fails

- Ensure file is JPG/PNG/WEBP
- Check file size (too large may timeout)
- Verify network connection

### Delete Not Working

- Check console for Firestore errors
- Verify you have delete permissions in Firestore rules

## Related Files

- **Admin Page**: `app/Admin/page.tsx`
- **Navigation**: `app/components/NavBar/NavBar.tsx`
- **Database Schema**: `DATABASE_STRUCTURE.md`
- **Firebase Config**: `firebase.ts`
