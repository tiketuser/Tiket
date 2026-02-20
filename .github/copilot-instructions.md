# Tiket — Copilot Instructions

## Project Overview

Tiket is a Hebrew-first, RTL ticket resale marketplace built with **Next.js 14 App Router**, **Firebase** (Auth + Firestore + Storage), and deployed to **Google Cloud Run** (region `me-west1`). Users upload ticket images, which are processed via OCR (Google Cloud Vision → Gemini AI), matched to concerts, and listed for sale.

## Architecture

### Data Model (Firestore)

Two core collections with a one-to-many relationship:

- **`concerts`** — unique events (artist, date, venue, base64 `imageData`, status, views)
- **`tickets`** — individual listings linked via `concertId` (seating, pricing, `sellerId`, OCR `extractedText`)
- **`artist_aliases`** — Hebrew↔English artist name mappings (read-only in Firestore rules)

Dates use `DD/MM/YYYY` format. Prices are in ₪ (ILS). See [DATABASE_STRUCTURE.md](../DATABASE_STRUCTURE.md) for full schemas and query examples.

### Firebase Setup — Two Layers

| Layer          | File                                              | Usage                                                                                                                                                                                           |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Client SDK** | [firebase.ts](../firebase.ts)                     | Re-exports all Firestore functions (`collection`, `getDocs`, `query`, `where`, etc.). Import from here — not from `firebase/firestore` directly. Falls back to nulls when env vars are missing. |
| **Admin SDK**  | [lib/firebase-admin.ts](../lib/firebase-admin.ts) | Server-side token verification, admin operations. Uses service account from env vars.                                                                                                           |

> There is also [lib/firebaseAdmin.ts](../lib/firebaseAdmin.ts) (uses Application Default Credentials for Cloud Run). Prefer `lib/firebase-admin.ts` for new server code.

### OCR / Ticket Processing Pipeline

```
Upload image → POST /api/ocr-extract
  1. Google Cloud Vision (textDetection, Hebrew+English)
  2. Barcode regex extraction (EAN-13, alphanumeric 8-20 chars)
  3. Gemini AI structured extraction (gemini-2.0-flash → 1.5-flash fallback)
  4. Returns: { artist, category, price, venue, date, time, barcode, seatInfo }
```

Artist matching uses a three-tier strategy in [utils/artistMatcher.ts](../utils/artistMatcher.ts): exact normalized → alias lookup → Levenshtein fuzzy (0.85 threshold). Normalization strips Hebrew quotes (״׳) and punctuation.

## Component Conventions

- **Folder-per-component** under `app/components/` — file matches folder name (e.g., `Card/Card.tsx`). No barrel `index.ts` files; import the component directly.
- Almost all components are **client components** (`"use client"`). The exception is `Gallery/Gallery.tsx` (server component) which fetches data server-side and passes it to `GalleryClient.tsx`.
- Heavy dialogs (Login, SignUp, Profile) are **lazy-loaded** via `next/dynamic` with `{ ssr: false }`.
- Pages use the App Router folder convention under `app/` (e.g., `app/EventPage/page.tsx`, `app/Favorites/page.tsx`).
- `EventPage` uses query params (`?title=...`) via `useSearchParams()`, not dynamic route segments.

## Styling

- **Tailwind CSS** + **DaisyUI** with custom design tokens in [tailwind.config.ts](../tailwind.config.ts).
- **Dynamic category theming** via CSS variables (`--color-primary`, `--color-secondary`, `--color-highlight`) applied at `:root`. Default theme is "מוזיקה" (music, red).
- Custom font size scale: use `text-heading-1-desktop`, `text-text-regular`, etc. from the Tailwind config — don't use raw pixel values.
- Custom shadow scale: `shadow-xxsmall` through `shadow-xxlarge` (plus `-inner` variants).
- Global direction is **RTL** (`direction: rtl` in body). Font is **Assistant** (Hebrew subset).

## API Routes

All under `app/api/*/route.ts`. Each route handles its own validation and error handling inline (no shared middleware layer). Pattern:

```typescript
export async function POST(request: NextRequest) {
  try {
    // Validate input
    // Do work with Firebase client SDK (import { db } from "@/firebase")
    // Return NextResponse.json({ ... })
  } catch (error) {
    return NextResponse.json({ error: "..." }, { status: 500 });
  }
}
```

Auth middleware exists at [lib/authMiddleware.ts](../lib/authMiddleware.ts) (`verifyAuth`, `requireAdmin`) but is not wired into most routes currently.

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

Dockerized multi-stage build → Google Cloud Run. `NEXT_PUBLIC_*` vars are build args (embedded in client bundle). Server secrets (`GEMINI_API_KEY`, credentials) are runtime env vars only. Both Cloud Build ([cloudbuild.yaml](../cloudbuild.yaml)) and GitHub Actions ([.github/workflows/deploy.yml](../.github/workflows/deploy.yml)) pipelines exist.

## Performance — Critical Priority

Site speed is a top priority. Always follow Next.js best practices for performance:

- **Prefer Server Components** — only add `"use client"` when the component genuinely needs browser APIs, hooks, or event handlers. Data fetching and rendering should stay on the server whenever possible (follow the `Gallery.tsx` → `GalleryClient.tsx` pattern).
- **Minimize client bundle** — use `next/dynamic` with `{ ssr: false }` for heavy components that aren't needed on initial render (modals, dialogs, admin panels). Avoid importing large libraries in client components.
- **Use Next.js `<Image>`** for any new non-base64 images — enables automatic lazy loading, responsive sizing, and format optimization.
- **Leverage ISR/caching** — use `revalidate` on server pages/layouts to avoid refetching on every request (home page uses `revalidate = 30`). Use `cache: 'force-cache'` or `next: { revalidate }` in `fetch` calls where appropriate.
- **Code-split aggressively** — keep page bundles small. Lazy-load below-the-fold sections and feature-specific code.
- **Avoid client-side data waterfalls** — fetch data in server components or parallel `Promise.all` calls, not in sequential `useEffect` chains.
- **Minimize re-renders** — memoize expensive computations with `useMemo`/`useCallback`, avoid passing new object/array literals as props.
- **Keep `"use client"` boundary as low as possible** — wrap only the interactive leaf component, not the entire page tree.

## Key Conventions

- **Hebrew UI strings** — all user-facing text is in Hebrew. Categories: מוזיקה, תיאטרון, סטנדאפ, ילדים, ספורט.
- **Admin check** is client-side email comparison against hardcoded admin emails in `AdminProtection` component.
- **ISR** on the home page: `export const revalidate = 30` (30-second cache).
- **No test framework** is configured — no test files exist in the project.
- Concert images are stored as **base64 data URIs** in Firestore (hence `images.unoptimized: true` in Next config).
