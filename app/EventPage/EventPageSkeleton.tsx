import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import MobileShell from "../components/mobile/MobileShell";
import Skeleton from "../components/Skeleton/Skeleton";

// Placeholder blocks use the design line color on the paper-cream background,
// mirroring MobileEventDetail's layout so the swap to real content is seamless.
function MobileEventSkeleton() {
  return (
    <MobileShell showBottomNav={false}>
      <div>
        {/* Poster */}
        <Skeleton style={{ width: "100%", height: 320 }} />

        {/* Title + stats */}
        <div style={{ padding: "18px 18px 0" }}>
          <Skeleton style={{ width: 56, height: 10, borderRadius: 6 }} />
          <Skeleton style={{ width: "70%", height: 28, borderRadius: 8, margin: "8px 0 16px" }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              padding: "14px 0",
              borderTop: "1px dashed var(--tk-line-strong)",
              borderBottom: "1px dashed var(--tk-line-strong)",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Skeleton style={{ width: 52, height: 52, borderRadius: 14 }} />
                <Skeleton style={{ width: 28, height: 8, borderRadius: 4 }} />
                <Skeleton style={{ width: 56, height: 12, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Seat map */}
        <div style={{ padding: "18px 18px 0" }}>
          <Skeleton style={{ width: 90, height: 16, borderRadius: 6, marginBottom: 12 }} />
          <div
            style={{
              height: 190,
              borderRadius: 16,
              background: "var(--tk-paper)",
              border: "1px solid var(--tk-line)",
            }}
          />
        </div>

        {/* Ticket rows */}
        <div style={{ padding: "18px 18px 24px" }}>
          <Skeleton style={{ width: 120, height: 14, borderRadius: 6, marginBottom: 10 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  borderRadius: 12,
                  background: "var(--tk-paper)",
                  border: "2px solid var(--tk-line)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

export default function EventPageSkeleton() {
  return (
    <>
      <MobileEventSkeleton />
      <div className="hidden md:block">
        <NavBar />
        <div className="flex flex-col sm:flex-row w-full sm:h-[346px] lg:pl-72 lg:pr-72 md:pt-4 md:pb-4 md:pr-24 md:pl-24 sm:pr-4 sm:pl-4 pb-6 shadow-small-inner">
          <div className="sm:hidden w-full flex justify-center pt-6 pb-4">
            <Skeleton className="w-[180px] h-[180px] rounded-lg" />
          </div>
          <div className="flex flex-col gap-3 sm:pt-8 px-5 sm:px-0 lg:w-[600px] sm:w-[382px] sm:h-[264px] w-full">
            <Skeleton className="h-8 sm:h-12 rounded w-3/4 mx-auto sm:mx-0" />
            <div className="sm:w-[382px] w-full h-[3px] mx-auto sm:mx-0 bg-gray-200" />
            <Skeleton className="h-5 rounded w-2/3 mx-auto sm:mx-0" />
            <Skeleton className="h-5 rounded w-1/2 mx-auto sm:mx-0" />
            <div className="flex gap-3 mt-2 justify-center sm:justify-start">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
          <div className="hidden sm:flex w-full justify-end items-center">
            <Skeleton className="lg:w-[310px] lg:h-[264px] md:w-[280px] md:h-[240px] sm:w-[230px] sm:h-[196px] rounded-xl" />
          </div>
        </div>
        <div className="px-4 sm:px-24 py-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-lg" />
          ))}
        </div>
        <Footer />
      </div>
    </>
  );
}
