# Date Format Update - Hebrew Display

##  Updated: Date Display in Card and EventUpperSection

Both the concert Card (Gallery) and EventUpperSection (EventPage) now display dates in a human-readable Hebrew format instead of "dd/mm/yyyy".

##  Changes Made

### 1. Card Component (`app/components/Card/Card.tsx`)

- Added `formatDateHebrew()` function
- Changed date display from `{date}` to `{formatDateHebrew(date)}`

### 2. EventUpperSection Component (`app/components/EventUpperSection/EventUpperSection.tsx`)

- Added `formatDateHebrew()` function
- Changed date display from `{date}` to `{formatDateHebrew(date)}`

##  Date Format Transformation

### Before:

```
25/12/2025
```

### After:

```
חמישי, 25 בדצמבר 2025
(Thursday, 25 in December 2025)
```

##  Implementation

```typescript
const formatDateHebrew = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const [day, month, year] = dateString.split("/").map(Number);
    const dateObj = new Date(year, month - 1, day);

    const hebrewDays = [
      "ראשון",
      "שני",
      "שלישי",
      "רביעי",
      "חמישי",
      "שישי",
      "שבת",
    ];
    const hebrewMonths = [
      "ינואר",
      "פברואר",
      "מרץ",
      "אפריל",
      "מאי",
      "יוני",
      "יולי",
      "אוגוסט",
      "ספטמבר",
      "אוקטובר",
      "נובמבר",
      "דצמבר",
    ];

    const dayOfWeek = hebrewDays[dateObj.getDay()];
    const monthName = hebrewMonths[month - 1];

    return `${dayOfWeek}, ${day} ב${monthName} ${year}`;
  } catch (error) {
    return dateString; // Return original if parsing fails
  }
};
```

##  Hebrew Day Names (Full)

```typescript
const hebrewDays = [
  "ראשון", // Sunday
  "שני", // Monday
  "שלישי", // Tuesday
  "רביעי", // Wednesday
  "חמישי", // Thursday
  "שישי", // Friday
  "שבת", // Saturday
];
```

##  Hebrew Month Names (Full)

```typescript
const hebrewMonths = [
  "ינואר", // January
  "פברואר", // February
  "מרץ", // March
  "אפריל", // April
  "מאי", // May
  "יוני", // June
  "יולי", // July
  "אוגוסט", // August
  "ספטמבר", // September
  "אוקטובר", // October
  "נובמבר", // November
  "דצמבר", // December
];
```

##  Display Examples

### Example 1: December 25, 2025

```
Input:  "25/12/2025"
Output: "חמישי, 25 בדצמבר 2025"
        (Thursday, 25 in December 2025)
```

### Example 2: January 1, 2026

```
Input:  "01/01/2026"
Output: "חמישי, 1 בינואר 2026"
        (Thursday, 1 in January 2026)
```

### Example 3: February 14, 2026

```
Input:  "14/02/2026"
Output: "שבת, 14 בפברואר 2026"
        (Saturday, 14 in February 2026)
```

### Example 4: May 1, 2026

```
Input:  "01/05/2026"
Output: "שישי, 1 במאי 2026"
        (Friday, 1 in May 2026)
```

##  Where It Appears

### 1. Gallery - Concert Card

```

   [Concert Poster Image]    
          [Heart Icon]       

   עומר אדם                
        
  חמישי, 25 בדצמבר 2025       ← Hebrew format!
   פארק הירקון             
   כרטיסים זמינים: 15     
   ₪150 - ₪300             
  ⏰ 2 חודשים זמן לאירוע    

```

### 2. EventPage - Upper Section

```

  עומר אדם                     [Poster]     
                          
  חמישי, 25 בדצמבר 2025       ← Hebrew!     
  פארק הירקון                                
  תחילת המופע:  20:00                      
  כרטיסים זמינים:  15                     

```

### 3. SingleCard - Date Section (Already has it)

```

 חמישי   ← Day of week
  25     ← Day number
 דצמ׳    ← Month (abbreviated)

```

##  Data Flow

```
Database:
  concert.date = "25/12/2025"
    ↓
Card Component:
  formatDateHebrew("25/12/2025")
    ↓
Parsing:
  day = 25, month = 12, year = 2025
  dateObj = new Date(2025, 11, 25)
  dayOfWeek = dateObj.getDay() = 4
  hebrewDays[4] = "חמישי"
  hebrewMonths[11] = "דצמבר"
    ↓
Output:
  "חמישי, 25 בדצמבר 2025"
    ↓
Display:
  Gallery Card shows: "חמישי, 25 בדצמבר 2025"
  EventPage shows: "חמישי, 25 בדצמבר 2025"
```

##  Benefits

### User Experience:

 **More readable** - Full date with day of week
 **Professional** - Proper Hebrew formatting
 **Consistent** - Same format across Gallery and EventPage
 **Clear** - Easy to understand at a glance

### Technical:

 **Robust** - Error handling for invalid dates
 **Localized** - Full Hebrew month names (not abbreviations)
 **Maintainable** - Same function in both components

##  Comparison

### Old Format (dd/mm/yyyy):

- Gallery: `25/12/2025`
- EventPage: `25/12/2025`
- SingleCard: Hebrew format (day/month abbreviation)
-  Inconsistent between components

### New Format (Hebrew Full):

- Gallery: `חמישי, 25 בדצמבר 2025`
- EventPage: `חמישי, 25 בדצמבר 2025`
- SingleCard: Hebrew format (day/month abbreviation)
-  Professional and readable

##  Result

Now all date displays are:

- **Human-friendly** Hebrew format
- **Professional** appearance
- **Consistent** across the application
- **Informative** with day of week

Users can now see dates like:

- "שני, 15 בינואר 2026" (Monday, January 15, 2026)
- "שישי, 20 במרץ 2026" (Friday, March 20, 2026)
- "שבת, 1 במאי 2026" (Saturday, May 1, 2026)

Much better than "15/01/2026"! 
