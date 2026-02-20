"use client";

import React from "react";
import { getAuth, deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

interface UserData {
  fname?: string;
  lname?: string;
  phone?: string;
  email?: string;
  photoURL?: string;
  displayName?: string;
  [key: string]: unknown;
}

interface UserDetailsProps {
  section: string;
  userData: UserData | null;
  loading: boolean;
}

const InfoCard = ({
  label,
  value,
  dir,
}: {
  label: string;
  value?: string;
  dir?: string;
}) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
      {label}
    </span>
    <span className="text-base font-bold text-gray-900 break-words" dir={dir}>
      {value || "—"}
    </span>
  </div>
);

const UserDetails: React.FC<UserDetailsProps> = ({
  section,
  userData,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-xl p-4 h-[68px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!userData && section === "personal") {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-lg font-semibold">לא נמצאו פרטים</p>
        <p className="text-sm mt-1">נסה להתחבר מחדש</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {section === "personal" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="שם פרטי" value={userData?.fname} />
            <InfoCard label="שם משפחה" value={userData?.lname} />
            <InfoCard label="אימייל" value={userData?.email} dir="ltr" />
            {userData?.phone && (
              <InfoCard label="טלפון" value={userData.phone} dir="ltr" />
            )}
          </div>

          {/* Delete account */}
          <div className="pt-4 border-t border-gray-100">
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
              onClick={async () => {
                if (
                  window.confirm(
                    "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה הפיכה.",
                  )
                ) {
                  const auth = getAuth();
                  const user = auth.currentUser;
                  if (user && db) {
                    try {
                      await deleteDoc(doc(db, "users", user.uid));
                      await deleteUser(user);
                      alert("החשבון נמחק בהצלחה.");
                      window.location.reload();
                    } catch (err) {
                      const msg =
                        err && typeof err === "object" && "message" in err
                          ? (err as { message?: string }).message
                          : String(err);
                      alert("מחיקת החשבון נכשלה: " + (msg || err));
                    }
                  }
                }
              }}
            >
              מחק חשבון לצמיתות
            </button>
          </div>
        </>
      )}

      {section === "payment" && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg font-semibold">פרטי תשלום</p>
          <p className="text-sm mt-1">בקרוב...</p>
        </div>
      )}

      {section === "activity" && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg font-semibold">סיכום פעולות</p>
          <p className="text-sm mt-1">בקרוב...</p>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
