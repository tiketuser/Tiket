import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { auth } from "../firebase";
import { isNative, isIOS } from "./platform";

async function getNativeFirebaseAuth() {
  const mod = await import("@capacitor-firebase/authentication");
  return mod.FirebaseAuthentication;
}

export async function signInWithGoogleCrossPlatform(): Promise<UserCredential | null> {
  if (!auth) return null;

  if (isNative()) {
    const FirebaseAuthentication = await getNativeFirebaseAuth();
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error("Google sign-in returned no idToken");
    const credential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, credential);
  }

  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signInWithAppleCrossPlatform(): Promise<UserCredential | null> {
  if (!auth) return null;

  if (!isIOS() && !isNative()) {
    throw new Error("Apple Sign-In is only available on iOS native");
  }

  const FirebaseAuthentication = await getNativeFirebaseAuth();
  const result = await FirebaseAuthentication.signInWithApple({
    scopes: ["email", "name"],
  });
  const idToken = result.credential?.idToken;
  const rawNonce = result.credential?.nonce;
  if (!idToken) throw new Error("Apple sign-in returned no idToken");

  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({ idToken, rawNonce });
  return signInWithCredential(auth, credential);
}

export async function signOutCrossPlatform(): Promise<void> {
  if (isNative()) {
    const FirebaseAuthentication = await getNativeFirebaseAuth();
    await FirebaseAuthentication.signOut();
  }
  if (auth) await signOut(auth);
}
