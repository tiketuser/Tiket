# Artist Alias API Migration Guide

## Overview

The `add-artist-alias` API endpoint has been migrated from writing to the filesystem to using Firestore as a persistent datastore. This addresses security concerns about runtime filesystem modifications and ensures data persistence on Cloud Run/serverless deployments.

## Changes Made

### 1. Firestore Integration
- **New Collection**: `artist_aliases` in Firestore
- **Structure**: Each document contains:
  - `canonical` (string): Normalized artist name used as document ID
  - `variations` (string[]): Array of all name variations
  - `createdAt` (timestamp): When the alias was created
  - `updatedAt` (timestamp): Last update timestamp

### 2. Admin Authentication
- **Firebase Admin SDK**: New utility in `lib/firebaseAdmin.ts`
- **Auth Middleware**: New utility in `lib/authMiddleware.ts`
- **Protection**: API endpoint now requires:
  - Valid Firebase ID token in Authorization header
  - Admin custom claims or admin email pattern

### 3. Artist Matcher Updates
- **Dual Source**: `utils/artistMatcher.ts` now supports:
  - Default hardcoded aliases (fallback)
  - Dynamic Firestore aliases (loaded server-side)
- **Function**: `loadArtistAliasesFromFirestore()` to load aliases on server

### 4. Security Rules
- **Firestore Rules**: Updated to allow:
  - Public read access for artist matching
  - No direct write access (only via authenticated API)

## Setup Instructions

### 1. Set Up Admin User

First, create an admin user if you haven't already:

```bash
node create-admin-user.js
```

Then set admin custom claims:

```bash
node set-admin-claim.js admin@tiket.com
```

### 2. Migrate Existing Aliases

Run the migration script to populate Firestore with default aliases:

```bash
node migrate-artist-aliases.js
```

### 3. Deploy Firestore Rules

Deploy the updated security rules:

```bash
firebase deploy --only firestore:rules
```

### 4. Environment Setup

For Cloud Run deployment, ensure the service account has:
- Firestore read/write permissions
- Firebase Authentication permissions

The app uses Application Default Credentials, so no additional configuration is needed on Cloud Run.

## API Usage

### Request Format

```bash
POST /api/add-artist-alias
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "canonicalName": "artist name",
  "hebrewName": "שם האמן",
  "englishName": "Artist Name",
  "variations": ["variation1", "variation2"]
}
```

### Response

Success (200):
```json
{
  "success": true,
  "message": "Artist alias added successfully to database",
  "alias": {
    "canonical": "artist name",
    "variations": ["שם האמן", "Artist Name", "variation1", "variation2"]
  }
}
```

Unauthorized (401):
```json
{
  "error": "Unauthorized: Missing or invalid authorization header"
}
```

Forbidden (403):
```json
{
  "error": "Forbidden: Admin privileges required"
}
```

## Testing

### Get Firebase ID Token

1. Sign in as admin in the app
2. Get the ID token from the Firebase Auth instance:
   ```javascript
   const user = auth.currentUser;
   const token = await user.getIdToken();
   console.log(token);
   ```

### Test API Call

```bash
curl -X POST https://your-app.com/api/add-artist-alias \
  -H "Authorization: Bearer <your-id-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "canonicalName": "test artist",
    "hebrewName": "אמן מבחן",
    "englishName": "Test Artist",
    "variations": ["test", "artist test"]
  }'
```

## Benefits

1. **Security**: No filesystem access at runtime, admin authentication required
2. **Persistence**: Data survives deployments and scales across instances
3. **Scalability**: Works on Cloud Run and serverless environments
4. **Auditability**: Timestamps track when aliases are created/updated
5. **Flexibility**: Can be managed via Firestore console or API

## Backward Compatibility

- Default aliases remain hardcoded as fallback
- Client-side artist matching continues to work
- Server-side code can load Firestore aliases when needed
- No breaking changes to existing functionality
