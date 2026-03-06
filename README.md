# TIKET — Community Ticket Marketplace

TIKET is a community-driven secondary ticket marketplace for Israel. It replaces social media "black market" chaos with a verified, automated platform where sellers list tickets, buyers purchase securely through Stripe, and funds are held in escrow until after the event.

**Domain:** tiket.co.il | **Founders:** Ofek Amar & Aviv Nir | **Status:** MVP

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + DaisyUI + Radix UI |
| Auth | Firebase Auth (email/password + Google OAuth) |
| Database | Firebase Firestore |
| Payments | Stripe (Payment Element + webhooks) |
| AI / OCR | Google Vision API + Gemini AI (ticket verification) |
| Barcode | zxing-wasm + Tesseract.js |
| Platform | Google Cloud Run (containerized) |
| CI/CD | GitHub Actions → Cloud Run on push to `main` |

---

## Project Structure

```
app/
├── page.tsx                  # Home / landing
├── EventPage/[title]/        # Event listing with tickets
├── MyTickets/                # Buyer's purchased tickets
├── MyListings/               # Seller's listed tickets
├── Favorites/                # Saved events
├── SearchResults/            # Search results page
├── Admin/                    # Admin dashboard
├── HowItWorks/               # Info page
├── ContactUs/                # Contact page
├── Privacy/ Terms/           # Legal pages
├── components/               # Shared UI components
│   └── Dialogs/CheckoutDialog/   # Full 4-step checkout flow
└── api/
    ├── stripe/
    │   ├── create-payment-intent/ # Reserve tickets + create PaymentIntent
    │   ├── confirm-payment/       # Mark tickets sold after payment
    │   ├── webhook/               # Stripe event handler (authoritative)
    │   ├── release-reservation/   # Release reserved tickets on cancel
    │   ├── create-connect-account/
    │   ├── account-status/
    │   └── dashboard-link/
    └── seller/
        └── payment-details/       # Seller bank account setup

lib/
├── stripe.ts           # Server-side Stripe client + fee helpers
├── stripe-client.ts    # Client-side Stripe.js loader
├── firebaseAdmin.ts    # Firebase Admin SDK
docs/                   # Project documentation
```

---

## Payment Flow

```
Buyer → create-payment-intent → tickets reserved (10 min timer)
      → Stripe Payment Element (card / Apple Pay / Google Pay)
      → confirm-payment (optimistic, fast path)
      → webhook: payment_intent.succeeded (authoritative fallback)
      → ticket marked sold, transaction record created
      → seller payout after 7 days post-event
```

- PCI Scope: **SAQ A** — card data handled entirely by Stripe.js, never touches the server
- Platform fee: configurable via `PLATFORM_FEE_PERCENT` env var (default 5%)
- Guest checkout supported (email + phone, no account required)

See [stripe-production-guide.md](stripe-production-guide.md) for the full production go-live checklist.

---

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Git

### Setup

```bash
git clone <repo-url>
cd tiket-ui-app
npm install
```

Create `.env.local` in the project root with:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_SERVICE_ACCOUNT_KEY=...   # JSON stringified

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=...

# Optional
PLATFORM_FEE_PERCENT=5
```

### Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

---

## Git Workflow

All work merges into `main`. Deploy is automatic on every push to `main` via GitHub Actions.

```bash
# Start a new feature
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Keep in sync
git fetch origin
git merge origin/main

# Push and open PR
git push origin feature/your-feature-name
# Open PR on GitHub → main
```

Branch naming:
- `feature/description` — new functionality
- `fix/description` — bug fixes

---

## Deployment

Deployed automatically to Google Cloud Run on push to `main`.

Manual deploy: see [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md)

---

## Recommended VS Code Extensions

- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Prettier
- ESLint

---

## Documentation

| File | Contents |
|---|---|
| [stripe-production-guide.md](stripe-production-guide.md) | Stripe go-live checklist + security audit |
| [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md) | Firestore collections and data model |
| [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md) | Cloud Run deployment guide |
| [ADMIN_SETUP.md](ADMIN_SETUP.md) | Admin panel setup |
| [ARTIST_MATCHING.md](ARTIST_MATCHING.md) | Artist alias and matching logic |
| [REAL_API_INTEGRATION_GUIDE.md](REAL_API_INTEGRATION_GUIDE.md) | Tickchak / Eventim API integration |
| [VENUE_API_INTEGRATION_PLAN.md](VENUE_API_INTEGRATION_PLAN.md) | Venue data integration plan |
