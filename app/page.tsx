import NavBar from "./components/NavBar/NavBar";
import HeroSection from "./components/HeroSection/HeroSection";
import Gallery from "./components/Gallery/Gallery";
import Footer from "./components/Footer/Footer";

// Use ISR - revalidate every 30 seconds for fresh data with caching
export const revalidate = 30;

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
