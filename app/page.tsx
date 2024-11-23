import NavBar from "./components/NavBar/NavBar";
import HeroSection from "./components/HeroSection/HeroSection";
import SearchBar from "./components/SearchBar/SearchBar";
import CardCarousel from "./components/CardCarousel/CardCarousel";
import Footer from "./components/Footer/Footer";

export default function Home() {
  return (
    <>
      <NavBar/>
      <HeroSection/>
      <SearchBar/>
      <CardCarousel/>
      <Footer/>
    </>
  );
}
