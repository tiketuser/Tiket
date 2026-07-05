import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "co.il.tiket.app",
  appName: "Tiket",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  ios: {
    // Web content extends under the status bar; pages pad with
    // env(safe-area-inset-top) so the event hero blends with the notch.
    contentInset: "never",
    backgroundColor: "#F5F1E8",
  },
  android: {
    backgroundColor: "#F5F1E8",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // Dark icons over the cream app; hero screens flip to light at runtime.
      style: "LIGHT",
      backgroundColor: "#F5F1E8",
      overlaysWebView: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "apple.com"],
    },
  },
};

export default config;
