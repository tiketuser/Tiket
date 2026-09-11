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
## App store submission status (updated 2026-09-05)

### App Store Connect (Tiket IL, Apple ID 6808811502, bundle co.il.tiket.app)
Done: Hebrew screenshots 6.5" + 6.9" (6 each), promotional text, description,
keywords, support URL https://tiket.co.il/ContactUs, marketing URL,
copyright "2026 Tiket", subtitle, category Entertainment / Shopping,
age rating 4+, privacy policy URL https://tiket.co.il/Privacy,
user privacy choices URL https://tiket.co.il/delete-account,
App Privacy published (9 data types, all App Functionality, linked, no tracking),
pricing free in 175 countries, availability all countries,
manual release, App Review contact info + reviewer notes.

Still open (owner only): upload build from Xcode, App Review demo account
username/password, Content Rights declaration, DSA trader status,
accept updated Apple Developer Program License Agreement.

Note: TARGETED_DEVICE_FAMILY changed from "1,2" to "1" (iPhone only) so iPad
screenshots are not required. Rebuild before archiving.
Build 3 is attached to version 1.0.

## Push notifications (built 2026-09-05)

Push was previously non-functional end to end: no aps-environment entitlement,
no APNs capability on the App ID, no AppDelegate remote-notification hooks,
`initNativePush` never called from anywhere, no /api/notifications/register-token
endpoint, and no sender.

Now in place:
- ios/App/App/App.entitlements: aps-environment = development (Xcode rewrites
  this to production when archiving with a distribution profile)
- Push Notifications capability enabled on App ID co.il.tiket.app
- AppDelegate forwards didRegisterForRemoteNotifications... to NotificationCenter
- Swapped @capacitor/push-notifications for @capacitor-firebase/messaging.
  The old plugin returns a raw APNs token on iOS, which is not an FCM
  registration token, so the FCM-based backend could never have delivered to it.
- lib/native-push.ts: permission, token, tokenReceived rotation, deep-link on tap
- lib/platform-auth.ts signOutCrossPlatform unregisters the token first
- app/components/mobile/MobileShell.tsx registers only once signed in
- app/api/notifications/register-token/route.ts: POST/DELETE, tokens at
  users/{uid}/pushTokens/{hash}
- lib/push-send.ts: sendPushToUser, prunes dead tokens, never throws
- Stripe webhook notifies seller and buyer on payment_intent.succeeded

Still needed before push works in production:
1. Create an APNs Auth Key (.p8) at developer.apple.com > Keys and upload it to
   Firebase console > Project settings > Cloud Messaging > Apple app config.
   No keys exist on the account today.
2. Run `npx cap sync` on the Mac (cap update hangs on the Linux VM), then
   rebuild and upload a new build. Build 3 in TestFlight predates all of this.
