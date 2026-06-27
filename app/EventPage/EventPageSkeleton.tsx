import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";

export default function EventPageSkeleton() {
  return (
    <div>
      <NavBar />
      <div className="flex flex-col sm:flex-row w-full sm:h-[346px] lg:pl-72 lg:pr-72 md:pt-4 md:pb-4 md:pr-24 md:pl-24 sm:pr-4 sm:pl-4 pb-6 shadow-small-inner animate-pulse">
        <div className="sm:hidden w-full flex justify-center pt-6 pb-4">
          <div className="w-[180px] h-[180px] bg-gray-200 rounded-lg" />
        </div>
        <div className="flex flex-col gap-3 sm:pt-8 px-5 sm:px-0 lg:w-[600px] sm:w-[382px] sm:h-[264px] w-full">
          <div className="h-8 sm:h-12 bg-gray-200 rounded w-3/4 mx-auto sm:mx-0" />
          <div className="sm:w-[382px] w-full h-[3px] bg-gray-200 mx-auto sm:mx-0" />
          <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto sm:mx-0" />
          <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto sm:mx-0" />
          <div className="flex gap-3 mt-2 justify-center sm:justify-start">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="hidden sm:flex w-full justify-end items-center">
          <div className="lg:w-[310px] lg:h-[264px] md:w-[280px] md:h-[240px] sm:w-[230px] sm:h-[196px] bg-gray-200 rounded-xl" />
        </div>
      </div>
      <div className="px-4 sm:px-24 py-8 space-y-3 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 sm:h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <Footer />
    </div>
  );
}
