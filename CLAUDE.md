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

## Contact & Metadata
- **Domain:** tiket.co.il
- **Founders:** Ofek Amar & Aviv Nir
- **Status:** MVP phase (Payments & Live API integration in progress)