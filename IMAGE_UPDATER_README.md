# 🎨 Concert Image Updater

## Overview

Automatically convert artist images from `public/images/Artist` to base64 and add them to concerts in Firestore.

## 🎯 Purpose

Instead of manually uploading concert posters one by one, this tool:

1. Reads professional artist images from your project
2. Converts them to base64 format
3. Matches them to concerts by artist name
4. Updates Firestore automatically

## 🚀 How to Use

### Option 1: Web UI (Recommended)

1. Visit: http://localhost:3000/update-images
2. Click "עדכן תמונות קונצרטים"
3. View results and statistics
4. Go to homepage to see updated concerts

### Option 2: Node.js Script

```bash
node update-concert-images.js
```

## 📁 Available Artist Images

The following artists have images in `public/images/Artist`:

| Image File          | Matches Artist Names                     |
| ------------------- | ---------------------------------------- |
| `Alma_Gov.png`      | עלמה זהר, עלמה גוב, Alma Zohar, Alma Gov |
| `Omer_Adam.png`     | עומר אדם, Omer Adam                      |
| `Shlomo_Artzi.png`  | שלמה ארצי, Shlomo Artzi                  |
| `Noa_Kirel.png`     | נועה קירל, Noa Kirel                     |
| `Keren_Peles.png`   | כרן פלס, Keren Peles                     |
| `Ravid_Plotnik.png` | רביד פלוטניק, Ravid Plotnik              |
| `Ron_Asael.png`     | רון אסעל, Ron Asael                      |
| `Tuna.png`          | טונה, Tuna                               |
| `mcbenny.png`       | מק בני, MC Benny                         |
| `fatelnavi.png`     | פאטן נבי, Faten Navi                     |
| `gayaviv.png`       | גיא אביב, Guy Aviv                       |
| `ofekrap.png`       | אופק רפ, Ofek Rap                        |

## 🔄 How It Works

### 1. Artist Matching

The script uses fuzzy matching to connect concerts to images:

- Compares concert `artist` field with known artist names
- Case-insensitive matching
- Handles Hebrew and English variations
- Partial name matching (e.g., "עומר" matches "עומר אדם")

### 2. Image Conversion

```
PNG/JPG File → Read from disk → Convert to base64 → Store in Firestore
```

### 3. Firestore Update

```typescript
await updateDoc(doc(db, "concerts", concertId), {
  imageData: "data:image/png;base64,iVBORw0KGgoAAAANSUh...",
});
```

### 4. Smart Skipping

- ✅ **Updates**: Concerts without images or with old image format
- ⏭️ **Skips**: Concerts already with base64 images
- ❌ **Reports**: Concerts with no matching image file

## 📊 Results

After running, you'll see:

```
📊 SUMMARY
==================================================
✅ Updated: 8 concerts
⏭️  Skipped (already has image): 2 concerts
❌ Not found: 1 concerts
📋 Total processed: 11 concerts
==================================================
```

### Status Meanings:

- **✅ Updated**: Image successfully added
- **⏭️ Skipped**: Already has a valid image
- **❌ Not Found**: No matching image file for this artist
- **❌ Error**: Technical issue during update

## 🎨 Adding New Artist Images

To add a new artist:

1. **Add image file** to `public/images/Artist/`

   - Format: PNG or JPG
   - Name: `Artist_Name.png` (e.g., `Static_Ben.png`)

2. **Update mapping** in both files:
   - `update-concert-images.js` (line 18)
   - `app/api/update-concert-images/route.ts` (line 4)

```javascript
const artistMapping = {
  // ... existing artists ...
  "Static_Ben.png": ["סטטיק בן אל תבורי", "Static", "סטטיק"],
};
```

3. **Run update** again to apply the new image

## 🔧 Technical Details

### Files Created:

- **update-concert-images.js** - Node.js CLI script
- **app/api/update-concert-images/route.ts** - Next.js API route
- **app/update-images/page.tsx** - Web UI for running update

### Dependencies:

- Firebase Admin SDK (for CLI script)
- Firebase Client SDK (for API route)
- Next.js API Routes
- FileReader API (for base64 conversion)

### Database Fields Updated:

```typescript
{
  imageData: string; // Base64 data URL
}
```

## 🚨 Troubleshooting

### "No concerts found in database"

**Solution**: Create concerts first:

- Run migration at `/migrate`
- Or create manually at `/Admin`

### "No matching image found"

**Solution**: Either:

- Add the artist image to `public/images/Artist/`
- Update the `artistMapping` to match the concert artist name
- Or upload image manually via Admin panel

### "Failed to convert image"

**Solution**: Check:

- Image file exists in `public/images/Artist/`
- Image file is not corrupted
- File has `.png` or `.jpg` extension

### "Already has image - skipping"

**Note**: This is normal! The script won't overwrite existing images.
To force update, manually delete the `imageData` field in Firestore first.

## 📝 Workflow Example

### Scenario: You just ran migration

Your database now has:

- 10 concerts with various artists
- Each concert has artist name but NO image

### Run the updater:

```
Visit: /update-images
Click: "עדכן תמונות קונצרטים"
```

### Results:

- ✅ 8 concerts matched and updated with images
- ❌ 2 concerts don't have matching images in folder

### What to do with the 2 unmatched:

- Option 1: Add their images to `public/images/Artist/`
- Option 2: Upload images manually via `/Admin`
- Option 3: Edit concert to use existing artist image

### View results:

```
Visit: /
Gallery now shows professional concert posters! 🎉
```

## 💡 Pro Tips

1. **Use high-quality images**

   - Minimum 800x800px
   - Professional photos or official artwork
   - PNG with transparency works best

2. **Consistent naming**

   - Use underscores: `Artist_Name.png`
   - Match Firebase artist field closely

3. **Test with one concert first**

   - Create one test concert
   - Run updater
   - Verify image appears correctly
   - Then run for all concerts

4. **Image size consideration**
   - Base64 images are ~33% larger than original
   - Keep original images under 500KB for best performance
   - Firestore has 1MB document size limit

## 🎯 Expected Results

### Before:

- Concerts in Gallery show placeholder or ticket scans
- Unprofessional appearance

### After:

- Concerts in Gallery show professional artist photos
- Clean, marketplace-quality appearance
- Consistent branding across all concerts

## 🔗 Related Pages

- `/Admin` - Create concerts manually
- `/migrate` - Convert tickets to concerts
- `/diagnostic` - View database contents
- `/` - Homepage gallery (see results)

## ✨ Benefits

- ⚡ **Fast**: Updates multiple concerts in seconds
- 🎨 **Professional**: Uses your curated artist images
- 🔄 **Automated**: No manual work per concert
- 🛡️ **Safe**: Skips concerts already with images
- 📊 **Transparent**: Shows detailed results

---

## 🎉 Summary

This tool makes it easy to give all your concerts professional, consistent images without manual uploading. Just run once and all matching concerts get their artist photos automatically!
