"use client";

import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import ProfileMenu from "../../ProfileMenu/ProfileMenu";
import UserDetails from "../../UserDetails/UserDetails";
import Image from "next/image";
import exitIcon from "../../../../public/images/Dialogs/exitIcon.svg";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  fname?: string;
  lname?: string;
  phone?: string;
  email?: string;
  photoURL?: string;
  displayName?: string;
  [key: string]: unknown;
}

const ProfileDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose }) => {
  const [selectedSection, setSelectedSection] = useState("personal");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUserData = async () => {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (user && db) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        } else {
          // Fallback: build from Firebase Auth profile
          const parts = user.displayName?.split(" ") || [];
          setUserData({
            fname: parts[0] || "",
            lname: parts.slice(1).join(" ") || "",
            email: user.email || "",
            photoURL: user.photoURL || "",
            displayName: user.displayName || "",
          });
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, [isOpen]);

  // Disable scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("no-doc-scroll");
    } else {
      document.body.classList.remove("no-doc-scroll");
    }
    return () => document.body.classList.remove("no-doc-scroll");
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName =
    userData?.displayName ||
    [userData?.fname, userData?.lname].filter(Boolean).join(" ") ||
    "משתמש";
  const avatarUrl = userData?.photoURL;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Backdrop close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white w-full sm:w-[520px] sm:max-h-[90vh] max-h-[92vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col animate-slideUp sm:animate-none shadow-xxlarge z-10">
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Close button */}
        <button
          className="absolute top-3 left-3 sm:top-4 sm:left-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-20"
          onClick={onClose}
        >
          <Image src={exitIcon} alt="סגור" height={18} width={18} />
        </button>

        {/* Profile header */}
        <div className="flex flex-col items-center pt-6 sm:pt-8 pb-4 px-6 border-b border-gray-100">
          {/* Avatar */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/20 to-highlight/20 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-medium mb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-3xl sm:text-4xl font-bold text-primary">
                {displayName.charAt(0)}
              </span>
            )}
          </div>

          {/* Name & Email */}
          {loading ? (
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1" />
          ) : (
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {displayName}
            </h2>
          )}
          {!loading && userData?.email && (
            <p className="text-sm text-gray-500 mt-0.5" dir="ltr">
              {userData.email}
            </p>
          )}
        </div>

        {/* Tab navigation */}
        <ProfileMenu onSelect={setSelectedSection} selected={selectedSection} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5">
          <UserDetails
            section={selectedSection}
            userData={userData}
            loading={loading}
          />
        </div>

        {/* Bottom accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-highlight to-primary" />
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProfileDialog;
