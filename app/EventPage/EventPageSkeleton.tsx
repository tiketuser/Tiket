import React from "react";
import NavBar from "../components/NavBar/NavBar";
import Footer from "../components/Footer/Footer";
import MobileShell from "../components/mobile/MobileShell";
import Skeleton from "../components/Skeleton/Skeleton";

// Mirrors MobileEventDetail block for block (320px poster, title, date and
// venue rows with icon chips, seat map card, listing cards) so the swap to
// real content doesn't shift anything.
function MobileEventSkeleton() {
  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 0",
    borderBottom: "1px solid var(--line)",
  };
  // A bar centred in a box of the real text's line height.
  const line = (lineHeight: number, barHeight: number, width: string | number, extra?: React.CSSProperties) => (
    <div style={{ height: lineHeight, display: "flex", alignItems: "center", ...extra }}>
      <Skeleton style={{ width, height: barHeight, borderRadius: 5 }} />
    </div>
  );
  return (
    <MobileShell showBottomNav={false} heroStatusBar>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Skeleton style={{ width: "100%", height: 320, borderRadius: 0 }} />

        <div style={{ padding: "20px 20px 0" }}>
          {line(30, 24, "68%")}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--line)" }}>
            {[0, 1].map((i) => (
              <div key={i} style={row}>
                <Skeleton style={{ width: 40, height: 40, borderRadius: 12, flex: "0 0 auto" }} />
                <div style={{ flex: 1 }}>
                  {line(22.5, 14, i ? "45%" : "55%")}
                  {line(19.5, 11, i ? "25%" : "18%", { marginTop: 1 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "24px 20px 0" }}>
          {line(25.5, 16, 92, { marginBottom: 12 })}
          <div
            style={{
              borderRadius: "var(--r-md)",
              padding: "12px 8px 8px",
              border: "1px solid var(--line)",
            }}
          >
            <Skeleton style={{ width: "100%", aspectRatio: "400 / 260", borderRadius: 10 }} />
          </div>
        </div>

        <div style={{ padding: "24px 20px 24px" }}>
          {line(25.5, 16, 132, { marginBottom: 12 })}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  boxShadow: "inset 0 0 0 1px var(--line-strong)",
                }}
              >
                <div style={{ flex: 1 }}>
                  {line(22.5, 14, "50%")}
                  {line(19.5, 11, "30%", { marginTop: 2 })}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  {line(25.5, 16, 52)}
                  {line(18, 10, 34, { marginTop: 1 })}
                </div>
              </div>
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
      <div className="hidden lg:block">
        <NavBar />
        <div className="flex flex-col sm:flex-row w-full sm:h-[346px] lg:pl-72 lg:pr-72 md:pt-4 md:pb-4 md:pr-24 md:pl-24 sm:pr-4 sm:pl-4 pb-6 shadow-small-inner">
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
          <div className="flex w-full justify-end items-center">
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
