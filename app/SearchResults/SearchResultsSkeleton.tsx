import NavBar from "../components/NavBar/NavBar";
import Skeleton from "../components/Skeleton/Skeleton";
import MobileLoading from "../components/mobile/MobileLoading";

export default function SearchResultsSkeleton() {
  return (
    <>
    <MobileLoading />
    <div className="hidden lg:block">
      <NavBar />
      <div className="shadow-small-inner py-6 sm:py-14 px-4 sm:px-24">
        <div className="mb-6 sm:mb-10">
          <Skeleton className="h-4 w-20 rounded mb-2" />
          <Skeleton className="h-8 sm:h-10 w-48 rounded mb-3" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-8">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-b-[4px] border-gray-200 p-3 sm:p-8 shadow-xlarge"
            >
              <Skeleton className="w-full h-32 sm:h-[264px] mb-2 sm:mb-4" />
              <Skeleton className="h-4 sm:h-6 rounded w-3/4 mb-2" />
              <Skeleton className="h-3 rounded w-1/2 mb-1" />
              <Skeleton className="h-3 rounded w-2/3 mb-3" />
              <Skeleton className="h-5 sm:h-7 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
