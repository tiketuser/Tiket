"use client";

import React, { useEffect, useRef } from "react";
import Card from "../Card/Card";

interface CardData {
  imageSrc: string;
  id: string | number;
  title: string;
  date: string;
  location: string;
  ticketsLeft: number;
  price: number;
  maxPrice?: number;
  soldOut: boolean;
  timeLeft: string;
  time?: string;
}

interface RegularGalleryProps {
  cardsData: CardData[];
  openLoginDialog: () => void;
  userFavorites?: (string | number)[];
  onNearEnd?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

const RegularGallery: React.FC<RegularGalleryProps> = ({
  cardsData,
  openLoginDialog,
  userFavorites,
  onNearEnd,
  isLoadingMore,
  hasMore,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const onNearEndRef = useRef(onNearEnd);
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  onNearEndRef.current = onNearEnd;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onNearEnd) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          onNearEndRef.current?.();
        }
      },
      { rootMargin: "300px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onNearEnd]);

  return (
    <div className="w-full px-0 sm:px-8 sm:mt-10 sm:mb-0 mb-20">
      {/* Grid Layout for desktop */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {cardsData.map((card) => (
          <div key={card.id} className="w-full">
            <Card
              {...card}
              openLoginDialog={openLoginDialog}
              userFavorites={userFavorites}
            />
          </div>
        ))}
        <div ref={sentinelRef} className="col-span-4 h-1" aria-hidden="true" />
        {isLoadingMore && (
          <div className="col-span-4 flex justify-center py-6">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
      {/* Grid Layout for screens < sm - 2 cards per row */}
      <div className="sm:hidden grid grid-cols-2 gap-3 w-full">
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

export default RegularGallery;
