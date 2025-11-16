import { cookies, headers } from "next/headers";

/**
 * Get user ID from Firebase Auth session cookie
 * This is a simplified version - in production, you'd verify the token with Firebase Admin SDK
 */
export async function getUserIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // Check for Firebase Auth session cookie
    // Firebase Auth stores the user session in localStorage on client, 
    // but we can check for a custom session cookie if implemented
    const sessionCookie = cookieStore.get("__session");
    
    if (sessionCookie?.value) {
      // In production, you'd verify this token with Firebase Admin SDK
      // and extract the user ID
      return sessionCookie.value;
    }

    // Alternative: Check for custom user ID cookie set by client
    const userIdCookie = cookieStore.get("userId");
    if (userIdCookie?.value) {
      return userIdCookie.value;
    }

    return null;
  } catch (error) {
    console.error("Error getting user session:", error);
    return null;
  }
}

/**
 * Get user ID from request headers (useful for API routes)
 */
export async function getUserIdFromHeaders(): Promise<string | null> {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // In production, verify this token with Firebase Admin SDK
      return token;
    }

    return null;
  } catch (error) {
    console.error("Error getting user from headers:", error);
    return null;
  }
}
