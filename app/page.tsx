import NavBar from "./components/NavBar/NavBar";
import HeroSection from "./components/HeroSection/HeroSection";
import Gallery from "./components/Gallery/Gallery";
import Footer from "./components/Footer/Footer";

// Enable dynamic rendering with caching
export const dynamic = "force-dynamic";
export const revalidate = 30; // Revalidate every 30 seconds

export default function Home() {
  return (
    <>
      <NavBar />
      <HeroSection />
      <Gallery />
      <Footer />
    </>
  );
}
