# Admin User Setup

This directory contains scripts to create an admin user for the Tiket platform.

## Admin Credentials

**Email:** `admin@tiket.com`  
**Password:** `admin`

⚠️ **Important:** Change this password after first login!

## Authorized Admin Emails

The following emails have admin access:

1. `tiketbizzz@gmail.com` (main admin)
2. `admin@tiket.com` (test admin)

You can add more admin emails by editing `app/components/AdminProtection/AdminProtection.tsx`

## How to Create Admin User

### Option 1: Using Firebase Client SDK (Recommended)

This is the easiest method and doesn't require any additional setup:

```bash
# Install firebase dependencies if not already installed
npm install firebase

# Run the script
node create-admin-simple.js
```

### Option 2: Using Firebase Admin SDK

This requires the Firebase Admin SDK and service account credentials:

```bash
# Install firebase-admin if not already installed
npm install firebase-admin

# Make sure creds.json exists in the root directory
# Run the script
node create-admin-user.js
```

### Option 3: Manual Creation via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `tiket-72e3e`
3. Go to **Authentication** → **Users**
4. Click **Add User**
5. Enter:
   - Email: `admin@tiket.com`
   - Password: `admin` (or any password you prefer)
6. Click **Add User**

## Verifying Admin Access

1. Go to your website
2. Login with the admin credentials
3. Navigate to `/Admin` or `/approve-tickets`
4. If you see the admin page, access is working! ✅
5. If you're redirected to home, check:
   - Email is correctly added to `ADMIN_EMAILS` array
   - User is logged in with correct email
   - Check browser console for any errors

## Troubleshooting

### "Email already in use" error

The user already exists. You can:

- Use the existing credentials to login
- Delete the user from Firebase Console and run the script again
- Reset the password via Firebase Console

### "Access Denied" when visiting admin pages

- Make sure you're logged in with an admin email
- Check that the email is in the `ADMIN_EMAILS` array in `AdminProtection.tsx`
- Clear browser cache and cookies, then login again

### Password too weak

Firebase requires passwords to be at least 6 characters. The default "admin" password meets this requirement.

## Security Notes

- ⚠️ **Never commit admin passwords to git**
- ⚠️ **Change default passwords in production**
- ⚠️ The "admin/admin" credentials are for development/testing only
- Consider using environment variables for admin email lists in production
- Implement proper role-based access control (RBAC) for production

## Adding More Admins

Edit `app/components/AdminProtection/AdminProtection.tsx`:

```typescript
const ADMIN_EMAILS = [
  "tiketbizzz@gmail.com",
  "admin@tiket.com",
  "newadmin@example.com", // Add new admin email here
];
```

Then create the user account via Firebase Console or the scripts above.
