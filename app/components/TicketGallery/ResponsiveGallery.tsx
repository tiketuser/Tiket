"use client";

import React, { useState, useEffect, useRef } from "react";
import Card from "../Card/Card";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  NavigationDotes,
  type CarouselApi,
} from "@/components/ui/carousel";

interface CardData {
  imageSrc: string;
  id: string | number;
  title: string;
  date: string;
  location: string;
  ticketsLeft: number;
  price: number;
  soldOut: boolean;
  timeLeft: string;
}

interface ResponsiveGalleryProps {
  cardsData: CardData[];
  openLoginDialog: () => void;
  userFavorites?: (string | number)[];
  hideViewMore?: boolean;
  onNearEnd: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
}

const DRAG_THRESHOLD_PX = 5;

const ResponsiveGallery: React.FC<ResponsiveGalleryProps> = ({
  cardsData,
  openLoginDialog,
  userFavorites,
  hideViewMore,
  onNearEnd,
  isLoadingMore,
  hasMore,
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keep latest props in refs so event handlers never close over stale values
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const onNearEndRef = useRef(onNearEnd);
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  onNearEndRef.current = onNearEnd;

  // Desktop: load more when near end of carousel
  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      const total = carouselApi.scrollSnapList().length;
      const current = carouselApi.selectedScrollSnap();
      if (current >= total - 2 && hasMoreRef.current && !isLoadingMoreRef.current) {
        onNearEndRef.current();
      }
    };

    carouselApi.on("select", handleSelect);
    return () => { carouselApi.off("select", handleSelect); };
  }, [carouselApi]);

  // When new cards are appended, reinitialize Embla at the current scroll position
  // so new slides are registered without jumping back to the start.
  const prevCardCountRef = useRef(cardsData.length);
  useEffect(() => {
    if (!carouselApi) return;
    if (cardsData.length <= prevCardCountRef.current) {
      prevCardCountRef.current = cardsData.length;
      return;
    }
    const currentSnap = carouselApi.selectedScrollSnap();
    carouselApi.reInit({ startIndex: currentSnap });
    prevCardCountRef.current = cardsData.length;
  }, [carouselApi, cardsData.length]);

  // Attach native drag-detection listeners to Embla's own viewport node.
  // We measure actual pointer travel distance; if > threshold it was a drag,
  // and we block the subsequent click at the capture phase on the document.
  useEffect(() => {
    if (!carouselApi) return;

    const viewport = carouselApi.containerNode().parentElement as HTMLElement | null;
    if (!viewport) return;

    let startX = 0;
    let startY = 0;
    let wasDrag = false;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      wasDrag = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!e.buttons) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
        wasDrag = true;
      }
    };

    // Block the click that follows a drag. Uses capture on the document
    // so it fires before Next.js <Link> onClick.
    const onClickCapture = (e: MouseEvent) => {
      if (wasDrag) {
        e.preventDefault();
        e.stopPropagation();
        wasDrag = false;
      }
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [carouselApi]);

  // Mobile: load more when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          onNearEndRef.current();
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full px-2 sm:px-2 sm:mt-10 sm:mb-0 mb-20">
      {/* Carousel for screens >= sm */}
      <div className="hidden sm:block overflow-hidden px-6">
        <Carousel
          dir="ltr"
          className="w-full relative"
          opts={{ align: "start", dragFree: false, duration: 25, slidesToScroll: 3, watchSlides: false }}
          setApi={setCarouselApi}
        >
          <CarouselContent className="-ml-6">
            {cardsData.map((card) => (
              <CarouselItem
                key={card.id}
                dir="rtl"
                className="pl-6 basis-auto shrink-0"
              >
                <div className="w-[400px] h-[700px]">
                  <Card
                    {...card}
                    openLoginDialog={openLoginDialog}
                    userFavorites={userFavorites}
                  />
                </div>
              </CarouselItem>
            ))}
            {isLoadingMore && (
              <CarouselItem dir="rtl" className="pl-6 basis-auto shrink-0">
                <div className="w-[400px] h-[700px] flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="absolute left-[-16px]" />
          <CarouselNext className="absolute right-[-16px]" />
          <NavigationDotes />
        </Carousel>
        {!hideViewMore && (
          <div className="flex justify-center mt-6">
            <Link
              href="/ViewMore"
              className="px-8 py-2 rounded-full border border-primary text-primary text-text-large hover:bg-primary hover:text-white transition-colors duration-200"
            >
              גלה עוד
            </Link>
          </div>
        )}
      </div>
      {/* Grid Layout for screens < sm - 2 cards per row */}
      <div className="sm:hidden grid grid-cols-2 gap-2 w-full px-1 mt-4 mb-6">
        {cardsData.map((card) => (
          <div key={card.id} className="w-full">
            <Card
              {...card}
              openLoginDialog={openLoginDialog}
              userFavorites={userFavorites}
            />
          </div>
        ))}
        <div ref={sentinelRef} className="col-span-2 h-1" aria-hidden="true" />
        {isLoadingMore && (
          <div className="col-span-2 flex justify-center py-4">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveGallery;
