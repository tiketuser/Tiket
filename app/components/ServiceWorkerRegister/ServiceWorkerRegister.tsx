"use client";

import { useEffect } from "react";
import { isNative } from "@/lib/platform";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (isNative()) return;
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }, []);

  return null;
}
