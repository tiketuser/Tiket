# Project TIKET: Community Ticket Marketplace

TIKET is a community-driven digital marketplace for secure secondary ticket resale in Israel. It replaces social media "black market" chaos with a verified, automated system using primary ticketing API integrations.

## Tech Stack & Architecture
- **Framework:** Next.js (App Router preferred)
- **Platform:** Google Cloud Run (Containerized)
- **CI/CD:** GitHub Actions
- **Database/Auth:** Firebase (Firestore & Firebase Auth)
- **AI/OCR:** Google Vision API + Gemini AI for ticket verification

## Development Workflows
- **Build:** `npm run build`
- **Dev:** `npm run dev`
- **Lint:** `npm run lint`
- **Deploy:** Automated via GitHub Actions on push to `main`

## Project Structure & Conventions
- **Routing:** App Router conventions (`app/` directory)
- **Components:** Functional components with TypeScript. Separate Client (`'use client'`) and Server components
- **Verification Logic:** OCR extraction via Google Vision -> Analysis via Gemini -> API handshake with providers (Tickchak, Eventim, etc.)
- **Security:** Funds are captured into escrow; payouts occur 5-7 days post-event to prevent "double-selling" or fraud

## Coding Standards
- **Naming:** CamelCase for files, PascalCase for components.
- **Style:** Minimalist, performance-focused code. Avoid bloated context; use progressive disclosure.
- **AI Rule:** ALWAYS check version-matched documentation in `node_modules/next/dist/docs/` before implementing new Next.js features.

## Visual Design & Brand

### Colors
- **Primary:** `#B54653` (red-rose - default/music category)
- **Secondary:** `#EAC4C7` (light pink)
- **Highlight:** `#8C5A5F` (dark rose)
- **Theme color (meta):** `#6366f1` (indigo - used in PWA/browser chrome)
- **Mobile background:** `#F5F1E8` (warm cream / "paper-cream")
- **Mobile paper:** `#FBF8F1`
- **Strong text:** `#3C3E5F`
- **Muted text:** `#667085`
- **Success/OK:** `#0B7A3E`

### Category color theming
Colors are dynamic via CSS variables (`--color-primary`, `--color-secondary`, `--color-highlight`). Each category (מוזיקה, סטנדאפ, תיאטרון, ספורט, ילדים) overrides these vars for its theme.

### Typography
- **Body font:** Assistant (Hebrew, RTL)
- **Mobile font:** Heebo (Hebrew, RTL)
- **Mono font:** JetBrains Mono (used in `.tk-mono` elements)
- **Direction:** RTL throughout

### Design Language
- Warm "paper-cream" palette on mobile (`tk-mobile` scope: `#F5F1E8` bg)
- Minimalist, performance-focused
- Bottom navigation bar on mobile (64px + safe-area-inset)
- Logo style: lowercase `tiket.` with a colored dot

### App Identity
- **App name:** Tiket
- **Tagline:** כרטיסים בקליק
- **Description:** פלטפורמת מסחר בכרטיסים לאירועים
- **Hero copy:** "הופעה סולד-אאוט? / לא יכולים להגיע? - הזדמנות נוספת לכרטיסים - קנו ומכרו בקלות ובאופן מאובטח."

### Android / Play Store
- Package built via Capacitor (capacitor.config.ts)
- Icons exist at all mipmap densities (ic_launcher, ic_launcher_round, ic_launcher_foreground)

## Contact & Metadata
- **Domain:** tiket.co.il
- **Founders:** Ofek Amar & Aviv Nir
- **Status:** MVP phase (Payments & Live API integration in progress)