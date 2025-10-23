# 🚀 Quick Setup for Other PC

## Option 1: Run Setup Script (Easiest)

### On Windows:

```bash
setup-env.bat
```

### On Mac/Linux:

```bash
chmod +x setup-env.sh
./setup-env.sh
```

This will automatically create:

- `.env.local` with all environment variables
- `creds.json` with Firebase service account credentials

## Option 2: Manual Setup

If the script doesn't work, manually create these files:

### 1. Create `.env.local` in project root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCGiiy5smPnTFY7RdhsHfe12briESgTr4k
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tiket-9268c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tiket-9268c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tiket-9268c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=653453593991
NEXT_PUBLIC_FIREBASE_APP_ID=1:653453593991:web:67009ebea86a870f735722
REPLICATE_API_KEY=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
OPENROUTER_MODEL=openrouter/anthropic/claude-3.5-sonnet
GOOGLE_APPLICATION_CREDENTIALS=./creds.json
GEMINI_API_KEY=AIzaSyC5MY27mvbNmWi_hN4X06f8cyYnazw1Idc
```

### 2. Copy `creds.json` from this PC to your other PC

## After Setup:

1. Install dependencies:

```bash
npm install
```

2. Login to Firebase (if using Firebase CLI):

```bash
firebase login
firebase use tiket-9268c
```

3. Run development server:

```bash
npm run dev
```

## ⚠️ Security Note

These setup scripts contain sensitive credentials. Keep them secure and never commit them to public repositories!
