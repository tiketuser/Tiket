import NavBar from "../components/NavBar/NavBar";

export default function SearchResultsSkeleton() {
  return (
    <div>
      <NavBar />
      <div className="shadow-small-inner py-6 sm:py-14 px-4 sm:px-24 animate-pulse">
        <div className="mb-6 sm:mb-10">
          <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
          <div className="h-8 sm:h-10 w-48 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-b-[4px] border-gray-200 p-3 sm:p-8 shadow-xlarge"
            >
              <div className="w-full h-32 sm:h-[264px] bg-gray-200 mb-2 sm:mb-4" />
              <div className="h-4 sm:h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-5 sm:h-7 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
