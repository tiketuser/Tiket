import NavBar from "./components/NavBar/NavBar";
import HeroSection from "./components/HeroSection/HeroSection";
import Gallery from "./components/Gallery/Gallery";
import Footer from "./components/Footer/Footer";
// import firebaseApp from "../firebase"

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
