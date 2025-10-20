# Time Until Event - Display Improvements

## ✅ Fixed: Time Until Event Display

Improved the "time until event" display to be more readable, polished, and visually appealing.

## 🎯 Changes Made

### 1. Card Component Layout

**Before:**

```
[Icon] "3 ימים" "זמן לאירוע"
```

- Text direction: LTR (left-to-right)
- No label distinction
- Negative margin (mt-[-12px])
- All text same weight and color

**After:**

```
[Icon] "זמן לאירוע:" "בעוד 3 ימים"
```

- Text direction: RTL (right-to-left) - proper Hebrew
- Clear label with colon: "זמן לאירוע:"
- Time value highlighted in primary color
- Better spacing (mt-1 instead of mt-[-12px])

### 2. Visual Improvements

#### Layout Changes:

```typescript
// Before
<div dir="ltr" className="flex items-center gap-2 mt-[-12px]">
  <Image src={TimeLeftIcon} alt="heart icon" className="h-[15px] w-[15px]" />
  <span className="...text-strongText">{timeLeft}</span>
  <span className="...text-strongText">זמן לאירוע</span>
</div>

// After
<div dir="rtl" className="flex items-center gap-2 mt-1">
  <Image src={TimeLeftIcon} alt="time icon" className="h-[15px] w-[15px]" />
  <span className="...text-mutedText">זמן לאירוע:</span>
  <span className="...text-primary font-semibold">{timeLeft}</span>
</div>
```

#### Styling Updates:

- **Direction**: Changed from `dir="ltr"` to `dir="rtl"` (proper Hebrew reading direction)
- **Margin**: Changed from `mt-[-12px]` to `mt-1` (better spacing)
- **Label**: Changed to `text-mutedText` (less prominent)
- **Label punctuation**: Added colon `:` after "זמן לאירוע"
- **Time value**: Changed to `text-primary font-semibold` (highlighted and bold)
- **Icon alt text**: Fixed from "heart icon" to "time icon"

### 3. Enhanced Time Calculation

#### Before:

```typescript
if (diffDays === 0) return "היום!";
if (diffDays === 1) return "מחר";
if (diffDays < 7) return `${diffDays} ימים`;
if (diffDays < 30) return `${Math.floor(diffDays / 7)} שבועות`;
return `${Math.floor(diffDays / 30)} חודשים`;
```

#### After:

```typescript
if (diffDays < 0) return "האירוע עבר";
if (diffDays === 0) {
  if (diffHours <= 0) return "מתחיל עכשיו!";
  if (diffHours < 12) return `בעוד ${diffHours} שעות`;
  return "היום!";
}
if (diffDays === 1) return "מחר";
if (diffDays === 2) return "מחרתיים";
if (diffDays < 7) return `בעוד ${diffDays} ימים`;
if (diffDays < 14) return "בעוד שבוע";
if (diffDays < 30) {
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? "בעוד שבוע" : `בעוד ${weeks} שבועות`;
}
if (diffDays < 60) return "בעוד חודש";
const months = Math.floor(diffDays / 30);
return months === 1 ? "בעוד חודש" : `בעוד ${months} חודשים`;
```

## 📅 Time Display Examples

### Same Day:

- **0-12 hours away**: `בעוד 5 שעות` (in 5 hours)
- **Same day, >12 hours**: `היום!` (Today!)
- **Starting now**: `מתחיל עכשיו!` (Starting now!)

### Near Future:

- **1 day**: `מחר` (Tomorrow)
- **2 days**: `מחרתיים` (Day after tomorrow)
- **3-6 days**: `בעוד 3 ימים` (in 3 days)

### Weeks:

- **7-13 days**: `בעוד שבוע` (in a week)
- **14-29 days**: `בעוד 2 שבועות` (in 2 weeks)

### Months:

- **30-59 days**: `בעוד חודש` (in a month)
- **60+ days**: `בעוד 2 חודשים` (in 2 months)

### Past:

- **Negative days**: `האירוע עבר` (Event has passed)

## 🎨 Visual Comparison

### Before:

```
┌─────────────────────────────┐
│   [Concert Card]            │
│   ...                       │
│   💰 ₪150 - ₪300           │
│   ⏰ 3 ימים זמן לאירוע      │  ← Hard to read
└─────────────────────────────┘
```

### After:

```
┌─────────────────────────────┐
│   [Concert Card]            │
│   ...                       │
│   💰 ₪150 - ₪300           │
│   ⏰ זמן לאירוע: בעוד 3 ימים │  ← Clear & highlighted!
└─────────────────────────────┘
```

## 🌟 Benefits

### Visual:

✅ **Better hierarchy** - Label is muted, time is highlighted
✅ **Proper RTL** - Natural Hebrew reading direction
✅ **Better spacing** - Removed negative margin
✅ **Color coding** - Primary color draws attention to the time value

### Content:

✅ **More precise** - Shows hours for same-day events
✅ **Better grammar** - "בעוד" (in) prefix for all future times
✅ **Natural language** - "מחרתיים" instead of "2 ימים"
✅ **Special cases** - "מתחיל עכשיו!" for events starting now
✅ **Singular handling** - "בעוד שבוע" not "בעוד 1 שבועות"

## 📊 Complete Time Ranges

| Time Range        | Old Display  | New Display        |
| ----------------- | ------------ | ------------------ |
| -1 days           | "האירוע עבר" | "האירוע עבר" ✓     |
| 0 days, 2 hours   | "היום!"      | "בעוד 2 שעות" ✨   |
| 0 days, >12 hours | "היום!"      | "היום!" ✓          |
| 0 days, 0 hours   | "היום!"      | "מתחיל עכשיו!" ✨  |
| 1 day             | "מחר"        | "מחר" ✓            |
| 2 days            | "2 ימים"     | "מחרתיים" ✨       |
| 3 days            | "3 ימים"     | "בעוד 3 ימים" ✨   |
| 7 days            | "1 שבועות"   | "בעוד שבוע" ✨     |
| 14 days           | "2 שבועות"   | "בעוד 2 שבועות" ✨ |
| 30 days           | "1 חודשים"   | "בעוד חודש" ✨     |
| 60 days           | "2 חודשים"   | "בעוד 2 חודשים" ✨ |

## 🎯 Implementation Details

### Card Display (RTL):

```
[Icon] → זמן לאירוע: → בעוד 3 ימים
(muted gray)    (primary red, bold)
```

Reading order (RTL):

1. Icon (visual anchor)
2. Label "זמן לאירוע:" (what it is)
3. Value "בעוד 3 ימים" (the actual time)

### Color Palette:

- **Label**: `text-mutedText` (#667085) - subtle, non-intrusive
- **Value**: `text-primary` (#b54653) - branded color, attention-grabbing
- **Font weight**: Label is `font-light`, value is `font-semibold`

## ✨ Result

The "time until event" display is now:

- **More readable** with proper RTL direction
- **Visually enhanced** with color coding and typography
- **More informative** with precise time ranges
- **Better grammar** with proper Hebrew expressions
- **Professionally styled** with proper spacing and hierarchy

Users can now easily see at a glance:

- ⏰ זמן לאירוע: **היום!**
- ⏰ זמן לאירוע: **בעוד 3 שעות**
- ⏰ זמן לאירוע: **מחרתיים**
- ⏰ זמן לאירוע: **בעוד שבוע**
- ⏰ זמן לאירוע: **בעוד חודש**

Much better! 🎉
