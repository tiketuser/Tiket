import NavBar from "./components/NavBar/NavBar";
import HeroSection from "./components/HeroSection/HeroSection";
import Gallery from "./components/Gallery/Gallery";
import Footer from "./components/Footer/Footer";
import MobileHome from "./components/mobile/MobileHome";


export default function Home() {
  return (
    <>
      <MobileHome />
      <div className="hidden md:block">
        <NavBar />
        <HeroSection />
        <Gallery />
        <Footer />
      </div>
    </>
  );
}
