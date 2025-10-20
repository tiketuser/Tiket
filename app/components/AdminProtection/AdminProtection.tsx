"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

interface AdminProtectionProps {
  children: React.ReactNode;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "tiketbizzz@gmail.com") {
        setIsAdmin(true);
        setIsLoading(false);
      } else {
        setIsAdmin(false);
        setIsLoading(false);
        // Redirect to home if not admin
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-heading-2-desktop font-bold text-primary mb-4">
            🔒 מאמת הרשאות...
          </div>
          <div className="text-body-medium text-mutedText">אנא המתן</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-heading-1-desktop font-bold text-red-600 mb-4">
            ⛔ גישה נדחתה
          </div>
          <div className="text-body-large text-mutedText mb-6">
            אין לך הרשאות לצפות בעמוד זה
          </div>
          <a
            href="/"
            className="inline-block bg-primary hover:bg-highlight text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200"
          >
            חזרה לדף הבית
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
