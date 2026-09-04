import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  browserPopupRedirectResolver,
  type UserCredential,
} from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth } from "../firebase";
import { isNative, isIOS } from "./platform";

export async function signInWithGoogleCrossPlatform(
  onStage?: (stage: string) => void,
): Promise<UserCredential | null> {
  if (!auth) return null;

  if (isNative()) {
    onStage?.("native-plugin");
    console.log("[platform-auth] calling FirebaseAuthentication.signInWithGoogle");
    const result = await FirebaseAuthentication.signInWithGoogle();
    console.log("[platform-auth] native plugin returned, idToken?", !!result.credential?.idToken);
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error("Google sign-in returned no idToken");
    onStage?.("web-credential");
    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(auth, credential);
    console.log("[platform-auth] signInWithCredential resolved, uid=", userCred.user.uid);
    return userCred;
  }

  // Pass the resolver explicitly: initializeAuth in firebase.ts can't wire it
  // up at module load (SSR-incompatible), so signInWithPopup needs it here.
  return signInWithPopup(
    auth,
    new GoogleAuthProvider(),
    browserPopupRedirectResolver,
  );
}

export async function signInWithAppleCrossPlatform(): Promise<UserCredential | null> {
  if (!auth) return null;

  if (!isIOS() && !isNative()) {
    throw new Error("Apple Sign-In is only available on iOS native");
  }

  // skipNativeAuth: true so the plugin does NOT sign into the native Firebase
  // SDK itself — it just returns the Apple idToken + the RAW (unhashed) nonce so
  // we can complete sign-in through the Firebase JS SDK below. With the default
  // (false) the native layer consumes the nonce and the JS signInWithCredential
  // fails on nonce mismatch right after the Apple sheet closes.
  const result = await FirebaseAuthentication.signInWithApple({
    scopes: ["email", "name"],
    skipNativeAuth: true,
  });
  const idToken = result.credential?.idToken;
  const rawNonce = result.credential?.nonce;
  if (!idToken) throw new Error("Apple sign-in returned no idToken");

  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({ idToken, rawNonce });
  return signInWithCredential(auth, credential);
}

export function isAuthCancellation(err: unknown): boolean {
  const e = err as { code?: string | number; message?: string } | null;
  if (!e) return false;
  const code = String(e.code ?? "");
  const message = String(e.message ?? "").toLowerCase();
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    code === "auth/user-cancelled" ||
    code === "12501" ||
    message.includes("canceled") ||
    message.includes("cancelled") ||
    message.includes("user closed")
  );
}

export async function signOutCrossPlatform(): Promise<void> {
  if (isNative()) {
    await FirebaseAuthentication.signOut();
  }
  if (auth) await signOut(auth);
}
