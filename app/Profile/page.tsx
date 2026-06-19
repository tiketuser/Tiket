"use client";

import React from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import MobileProfile from "../components/mobile/MobileProfile";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return (
    <>
      <MobileProfile />
      <div className="hidden md:block">
        <NavBar />
        <div
          dir="rtl"
          className="min-h-screen flex flex-col items-center justify-center px-4 py-16 text-center"
        >
          <h1 className="text-3xl font-bold mb-3">הפרופיל שלי</h1>
          <p className="text-mutedText max-w-md">
            דף הפרופיל זמין כרגע רק בגרסת מובייל. כדי לראות אותו, פתח את האתר
            במכשיר נייד.
          </p>
        </div>
        <Footer />
      </div>
    </>
  );
}
