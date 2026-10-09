import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import MobileLoading from "../components/mobile/MobileLoading";

export default function Loading() {
  return (
    <>
    <MobileLoading label="טוען אירועים..." />
    <div className="hidden lg:block">
      <NavBar />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="mt-4 text-xl text-gray-600">טוען אירועים...</p>
      </div>
      <Footer />
    </div>
    </>
  );
}
