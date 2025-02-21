"use client";

import Link from "next/link";
import Image from "next/image";
import NotFoundHeader from "./components/NotFoundHeader/NotFoundHeader";
import NavBar from "./components/NavBar/NavBar";
import ContactSection from "./components/ContactSection/ContactSection";
import Footer from "./components/Footer/Footer";

export default function NotFound() {
  return (
    <div>
      <NavBar />
      <NotFoundHeader />
      <ContactSection />
      <Footer />
    </div>
  );
}
