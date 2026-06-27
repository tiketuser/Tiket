import { isNative } from "./platform";

const SERVER = "co.il.tiket.app";
const USERNAME = "firebase-refresh-token";

type StoredCreds = { username: string; password: string };

async function getBiometric() {
  const mod = await import("capacitor-native-biometric");
  return mod.NativeBiometric;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const NativeBiometric = await getBiometric();
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function storeRefreshToken(token: string): Promise<void> {
  if (!isNative()) return;
  const NativeBiometric = await getBiometric();
  await NativeBiometric.setCredentials({
    username: USERNAME,
    password: token,
    server: SERVER,
  });
}

export async function loadRefreshTokenWithBiometric(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const NativeBiometric = await getBiometric();
    await NativeBiometric.verifyIdentity({
      reason: "כניסה מהירה לחשבון שלך",
      title: "אימות זהות",
      subtitle: "השתמשו בזיהוי הביומטרי כדי להתחבר",
    });
    const creds: StoredCreds = await NativeBiometric.getCredentials({ server: SERVER });
    return creds.password;
  } catch {
    return null;
  }
}

export async function clearStoredCredentials(): Promise<void> {
  if (!isNative()) return;
  try {
    const NativeBiometric = await getBiometric();
    await NativeBiometric.deleteCredentials({ server: SERVER });
  } catch {
    // No credentials stored — ignore
  }
}
