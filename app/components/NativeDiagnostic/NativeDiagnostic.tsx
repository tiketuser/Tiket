"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

export default function NativeDiagnostic() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const platform = Capacitor.getPlatform();
    const available = Capacitor.isPluginAvailable("FirebaseAuthentication");
    console.log(
      `[NativeDiagnostic] platform=${platform} pluginAvailable=${available}`,
    );
    FirebaseAuthentication.getCurrentUser()
      .then((res) =>
        console.log(
          "[NativeDiagnostic] getCurrentUser ok",
          JSON.stringify(res),
        ),
      )
      .catch((err) =>
        console.error(
          "[NativeDiagnostic] getCurrentUser failed",
          err && typeof err === "object" && "code" in err
            ? (err as { code: string }).code
            : String(err),
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "",
        ),
      );
  }, []);
  return null;
}
