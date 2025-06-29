"use client";

import React, { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import RegularGallery from "../components/TicketGallery/RegularGallery";
import NavBar from "../components/NavBar/NavBar";
import ResultSection from "../components/ResultSection/ResultSection";
import HeartIcon from "../../public/images/Favorites/Heart.svg";
import Image from "next/image";

interface CardData {
  imageSrc: string;
  id: string | number;
  title: string;
  date: string;
  location: string;
  ticketsLeft: number;
  priceBefore: number;
  price: number;
  soldOut: boolean;
  timeLeft: string;
}

const Favorites = () => {
  const [favoriteCards, setFavoriteCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = not checked yet

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user === undefined) return; // Don't run until auth is checked
    if (!user) {
      setLoading(false);
      setFavoriteCards([]);
      return;
    }
    const fetchFavorites = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const favorites = userDoc.exists() ? userDoc.data().favorites || [] : [];
      if (favorites.length === 0) {
        setFavoriteCards([]);
        setLoading(false);
        return;
      }
      const ticketsSnapshot = await getDocs(collection(db, "tickets"));
      const allTickets: CardData[] = ticketsSnapshot.docs.map((doc) => ({
        ...(doc.data() as CardData),
        id: doc.id,
      }));
      setFavoriteCards(
        allTickets.filter((card) => favorites.includes(card.id))
      );
      setLoading(false);
    };
    fetchFavorites();
  }, [user]);

  // Define the function once
  const openLoginDialog = () => {};

  return (
    <div>
      <NavBar />
      <div className="shadow-small-inner py-14 px-24">
        <ResultSection
          withUpperSection={true}
          title="המועדפים שלי"
          image={
            <Image src={HeartIcon} alt="Example Icon" width={22} height={20} />
          }
          subText="אלו המופעים ששמרת במועדפים"
          artistNames={Array.from(
            new Set(favoriteCards.map((card) => card.title))
          )}
        />
        {user === undefined || loading ? (
          <div>טוען...</div>
        ) : !user ? (
          <div className="text-center text-red-500 text-xl mt-10">
            אנא התחבר כדי לראות את המועדפים שלך
          </div>
        ) : (
          <RegularGallery
            cardsData={favoriteCards}
            openLoginDialog={openLoginDialog}
          />
        )}
      </div>
    </div>
  );
};

export default Favorites;

const auth = getAuth();
setPersistence(auth, browserLocalPersistence);
