/**
 * Authentication middleware for API routes
 * Verifies Firebase ID tokens and checks admin status
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebaseAdmin';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string | undefined;
    isAdmin: boolean;
  };
}

/**
 * Verify Firebase ID token from Authorization header
 */
export async function verifyAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: { uid: string; email: string | undefined; isAdmin: boolean };
  error?: string;
}> {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      return {
        success: false,
        error: 'Authentication service not available',
      };
    }

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is admin
    const isAdmin = await checkIsAdmin(decodedToken.uid);

    return {
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        isAdmin,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Check if a user has admin privileges
 * For now, we check custom claims, but this could also check a users collection
 */
async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    if (!adminAuth) return false;
    
    // Get user record to check custom claims
    const userRecord = await adminAuth.getUser(uid);
    
    // Check if user has admin custom claim
    if (userRecord.customClaims?.admin === true) {
      return true;
    }

    // Alternatively, check if email matches admin email pattern
    // This is a fallback for development
    if (userRecord.email && userRecord.email.includes('admin@')) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Middleware to require admin authentication
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const authResult = await verifyAuth(request);

  if (!authResult.success) {
    return NextResponse.json(
      { error: 'Unauthorized: ' + authResult.error },
      { status: 401 }
    );
  }

  if (!authResult.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin privileges required' },
      { status: 403 }
    );
  }

  // Return null to indicate auth passed
  return null;
}
