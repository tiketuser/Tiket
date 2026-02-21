// components/Card.tsx
"use client";

import React, { useState, useEffect } from "react";
import TicketIcon from "../../../public/images/Home Page/Web/Ticket Icon.svg";
import PriceIcon from "../../../public/images/Home Page/Web/Price Icon.svg";
import TimeLeftIcon from "../../../public/images/Home Page/Web/TimeLeft.svg";
import HeartIcon from "../../../public/images/Home Page/Web/Favorite Tag.svg";
import Image from "next/image";
import Link from "next/link";
import { getAuth } from "firebase/auth";
import {
  setDoc,
  doc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";

interface CardProps {
  id: string | number;
  imageSrc: string;
  title: string;
  date: string;
  location: string;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  ticketsLeft: number;
  timeLeft: string;
  openLoginDialog: () => void;
  userFavorites?: (string | number)[]; // Pre-fetched favorites to avoid N+1 queries
}

const Card: React.FC<CardProps> = ({
  id,
  imageSrc,
  title,
  date,
  location,
  ticketsLeft,
  priceBefore,
  price,
  soldOut,
  timeLeft,
  openLoginDialog,
  userFavorites,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Use pre-fetched favorites if available, otherwise fetch individually (fallback)
  useEffect(() => {
    if (userFavorites !== undefined) {
      setIsFavorited(userFavorites.includes(id));
      return;
    }
    // Fallback: fetch individually (only if userFavorites not provided)
    const fetchFavorites = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db as any, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const favorites = userSnap.exists()
          ? userSnap.data().favorites || []
          : [];
        setIsFavorited(favorites.includes(id));
      }
    };
    fetchFavorites();
  }, [id, userFavorites]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      openLoginDialog();
      return;
    }
    const userRef = doc(db as any, "users", user.uid);
    if (isFavorited) {
      // Remove from favorites
      await setDoc(userRef, { favorites: arrayRemove(id) }, { merge: true });
      setIsFavorited(false);
    } else {
      // Add to favorites
      await setDoc(userRef, { favorites: arrayUnion(id) }, { merge: true });
      setIsFavorited(true);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  // Parse date string (format: "dd/mm/yyyy" or "dd.mm.yyyy") to Hebrew format
  const formatDateHebrew = (dateString: string): string => {
    if (!dateString || dateString === "undefined" || dateString === "null") {
      console.warn("Card: Invalid date string:", dateString);
      return "תאריך לא זמין";
    }

    try {
      // Normalize date separator to /
      const normalizedDate = dateString.replace(/\./g, "/");
      const parts = normalizedDate.split("/");
      if (parts.length !== 3) {
        console.warn("Card: Invalid date format:", dateString);
        return dateString;
      }

      const [day, month, year] = parts.map(Number);

      // Validate the numbers
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        console.warn("Card: Invalid date numbers:", {
          day,
          month,
          year,
          original: dateString,
        });
        return dateString;
      }

      const dateObj = new Date(year, month - 1, day);

      const hebrewDays = [
        "ראשון",
        "שני",
        "שלישי",
        "רביעי",
        "חמישי",
        "שישי",
        "שבת",
      ];
      const hebrewMonths = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ];

      const dayOfWeek = hebrewDays[dateObj.getDay()];
      const monthName = hebrewMonths[month - 1];

      return `${dayOfWeek}, ${day} ב${monthName} ${year}`;
    } catch (error) {
      console.error(
        "Card: Error formatting date:",
        error,
        "Original:",
        dateString,
      );
      return dateString;
    }
  };

  return (
    <div className="relative block w-full h-auto">
      <Link
        href={`/EventPage/${encodeURIComponent(title)}`}
        prefetch={true}
        className="block"
      >
        <div className="select-none transition-transform relative w-full h-full border-b-[4px] border-highlight p-3 sm:p-[32px] shadow-xlarge hover:duration-500 hover:scale-105 cursor-pointer">
          {/* Popup */}
          {showPopup && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 text-xs sm:text-sm">
              נוסף למועדפים!
            </div>
          )}

          {/* Last Chance */}
          {soldOut && (
            <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] sm:text-xs p-1 rounded-tr-lg rounded-bl-lg">
              Sold Out Show
            </div>
          )}
          {/* Artist Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            width={300}
            height={300}
            src={imageSrc}
            alt={title}
            className="w-full h-32 sm:h-[264px] mb-2 sm:mb-4 object-cover"
            loading="lazy"
          />
          {/* Title and show details section */}
          <div className="grid pt-2 sm:pt-6 pb-1 sm:pb-2 gap-1 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-12">
              <span className="text-sm sm:text-heading-3-mobile font-extrabold text-strongText whitespace-nowrap truncate max-w-[120px] sm:max-w-[280px]">
                {title}
              </span>
              <span className="relative bg-strongText flex-grow h-[2px] sm:h-[3px] rounded-lg"></span>
            </div>
            <div className="grid gap-0.5 sm:gap-1">
              <p className="text-[10px] sm:text-heading-6-desktop font-bold text-mutedText truncate">
                {formatDateHebrew(date)}
              </p>
              <p className="text-[10px] sm:text-heading-6-desktop font-bold text-mutedText truncate">
                {location}
              </p>

              <p className="text-[10px] sm:text-text-regular flex items-center font-light text-strongText">
                <span className="ml-1 sm:ml-4">כרטיסים זמינים</span>
                <Image
                  src={TicketIcon}
                  alt="Ticket icon"
                  className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1"
                />
                <span>{ticketsLeft} </span>
              </p>
            </div>
            {/* Price and time section */}
            <div
              dir="ltr"
              className="flex items-center gap-2 sm:gap-4 rtl:space-x-reverse"
            >
              <Image
                src={PriceIcon}
                alt="Price icon"
                className="h-6 w-3 sm:h-[42px] sm:w-[21px]"
              />
              {/* Show price range if different min and max prices */}
              {price !== priceBefore && priceBefore > price ? (
                <>
                  <span className="text-base sm:text-heading-4-desktop font-semibold text-strongText text-center">
                    ₪{price} - ₪{priceBefore}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs sm:text-heading-5-mobile font-bold text-mutedText line-through">
                    {priceBefore}
                  </span>
                  <span className="text-base sm:text-heading-4-desktop font-semibold text-strongText text-center">
                    {price} ₪
                  </span>
                </>
              )}
            </div>
            <div
              dir="rtl"
              className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 bg-gray-50 px-2 py-1 rounded"
            >
              <Image
                src={TimeLeftIcon}
                alt="time icon"
                className="h-2.5 w-2.5 sm:h-[12px] sm:w-[12px]"
              />
              <span className="text-[9px] sm:text-text-small font-normal text-mutedText">
                זמן לאירוע:
              </span>
              <span className="text-[9px] sm:text-text-small font-bold text-primary">
                {timeLeft}
              </span>
            </div>
          </div>
        </div>
      </Link>
      {/* Heart Icon - Outside Link to prevent nesting */}
      <button
        type="button"
        className="absolute w-12 h-12 sm:w-[100px] sm:h-[100px] top-2 sm:top-4 right-2 sm:right-8 btn btn-ghost btn-circle hover:transition-transform hover:duration-300 hover:scale-125 z-10"
        onClick={handleFavorite}
        aria-label="הוסף למועדפים"
      >
        <Image
          src={HeartIcon}
          alt="Heart Icon"
          width={80}
          style={{
            filter: isFavorited
              ? "brightness(0) invert(23%) sepia(700%) saturate(7496%)"
              : "none",
          }}
        />
      </button>
    </div>
  );
};

export default Card;
