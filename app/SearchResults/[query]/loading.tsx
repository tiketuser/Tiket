import NavBar from "../../components/NavBar/NavBar";
import Footer from "../../components/Footer/Footer";

export default function Loading() {
  return (
    <div>
      <NavBar />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="mt-4 text-xl text-gray-600">מחפש אירועים...</p>
      </div>
      <Footer />
    </div>
  );
}
