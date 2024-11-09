import NavBar from "./components/NavBar/NavBar";
import HeroSection from "./components/HeroSection/HeroSection";
import SearchBar from "./components/SearchBar/SearchBar";
import CardCarousel from "./components/CardCarousel/CardCarousel";

export default function Home() {
  return (
    <>
      <NavBar/>
      <HeroSection/>
      <SearchBar/>
      <CardCarousel/>
    </>
  );
}
