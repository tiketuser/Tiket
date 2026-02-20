# Tiket — Copilot Instructions

## Project Overview

Tiket is a Hebrew-first, RTL ticket resale marketplace built with **Next.js 14 App Router**, **Firebase** (Auth + Firestore + Storage), and deployed to **Google Cloud Run** (region `me-west1`). Users upload ticket images, which are processed via OCR (Google Cloud Vision -> Gemini AI), matched to concerts, and listed for sale.

## Architecture

### Data Model (Firestore)

Two core collections with a one-to-many relationship:

- **`concerts`** — unique events (artist, date, venue, base64 `imageData`, status, views)
- **`tickets`** — individual listings linked via `concertId` (seating, pricing, `sellerId`, OCR `extractedText`)
- **`artist_aliases`** — Hebrew<->English artist name mappings (read-only in Firestore rules)

Dates use `DD/MM/YYYY` format. Prices are in ILS. See `DATABASE_STRUCTURE.md` for full schemas and query examples.

### Firebase Setup — Two Layers

| Layer          | File                    | Usage                                                                                                                             |
| -------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Client SDK** | `firebase.ts`           | Re-exports all Firestore functions (`collection`, `getDocs`, `query`, `where`, etc.). Import from here, not `firebase/firestore`. |
| **Admin SDK**  | `lib/firebase-admin.ts` | Server-side token verification, admin operations. Uses service account from env vars. Prefer this for new server code.            |

### OCR / Ticket Processing Pipeline

```
Upload image -> POST /api/ocr-extract
  1. Google Cloud Vision (textDetection, Hebrew+English)
  2. Barcode regex extraction (EAN-13, alphanumeric 8-20 chars)
  3. Gemini AI structured extraction (gemini-2.0-flash -> 1.5-flash fallback)
  4. Returns: { artist, category, price, venue, date, time, barcode, seatInfo }
```

Artist matching uses a three-tier strategy in `utils/artistMatcher.ts`: exact normalized -> alias lookup -> Levenshtein fuzzy (0.85 threshold).

## Code Style Rules

- **Never use emojis** in code, UI strings, comments, or any output. Use plain text only.
- **Only add comments to complicated code** — do not comment obvious or self-explanatory code. If the logic is straightforward, let the code speak for itself.
- All user-facing text is in **Hebrew**.
- Global direction is **RTL** (`direction: rtl` in body). Font is **Assistant** (Hebrew subset).

## Component Conventions

- **Folder-per-component** under `app/components/` — file matches folder name (e.g., `Card/Card.tsx`). No barrel `index.ts` files.
- Almost all components are **client components** (`"use client"`). The exception is `Gallery/Gallery.tsx` (server component) which fetches data server-side and passes it to `GalleryClient.tsx`.
- Heavy dialogs (Login, SignUp, Profile) are **lazy-loaded** via `next/dynamic` with `{ ssr: false }`.
- `EventPage` uses query params (`?title=...`) via `useSearchParams()`, not dynamic route segments.

## Performance — Critical Priority

Site speed is a top priority. Always follow Next.js best practices:

- **Prefer Server Components** — only add `"use client"` when the component genuinely needs browser APIs, hooks, or event handlers. Follow the `Gallery.tsx` -> `GalleryClient.tsx` pattern.
- **Minimize client bundle** — use `next/dynamic` with `{ ssr: false }` for heavy components not needed on initial render.
- **Leverage ISR/caching** — use `revalidate` on server pages (home page uses `revalidate = 30`).
- **Avoid client-side data waterfalls** — fetch data in server components or parallel `Promise.all` calls, not sequential `useEffect` chains.
- **Keep `"use client"` boundary as low as possible** — wrap only the interactive leaf component, not the entire page tree.
- **Minimize re-renders** — memoize expensive computations with `useMemo`/`useCallback`.

## Styling

- **Tailwind CSS** + **DaisyUI** with custom design tokens in `tailwind.config.ts`.
- **Dynamic category theming** via CSS variables (`--color-primary`, `--color-secondary`, `--color-highlight`). Default theme is music (red).
- Custom font size scale: `text-heading-1-desktop`, `text-text-regular`, etc. Do not use raw pixel values.
- Custom shadow scale: `shadow-xxsmall` through `shadow-xxlarge` (plus `-inner` variants).

## API Routes

All under `app/api/*/route.ts`. Each route handles its own validation and error handling inline. Pattern:

```typescript
export async function POST(request: NextRequest) {
  try {
    // import { db } from "@/firebase"
    return NextResponse.json({ ... });
  } catch (error) {
    return NextResponse.json({ error: "..." }, { status: 500 });
  }
}
```

## Development

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build (standalone output)
npm run deploy       # Build + firebase deploy
```

Required env vars in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_*` (6 vars) — client-side Firebase config
- `GEMINI_API_KEY` — Google Gemini for OCR analysis
- `GOOGLE_APPLICATION_CREDENTIALS` — path to service account JSON (`./creds.json`)

## Deployment

Dockerized multi-stage build -> Google Cloud Run. `NEXT_PUBLIC_*` vars are build args (embedded in client bundle). Server secrets are runtime env vars only.

## Key Conventions

- Categories: music, theater, standup, kids, sports (Hebrew strings in UI).
- Admin check is client-side email comparison in `AdminProtection` component.
- Concert images are stored as base64 data URIs in Firestore (`images.unoptimized: true` in Next config).
- No test framework is configured.
