"use client";

import React from "react";
import { getAuth, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
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

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1 font-medium">{label}</p>
      <p className="text-base text-gray-900 font-semibold">{value}</p>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-[72px]" />
      ))}
    </div>
  );
}

const UserDetails: React.FC<UserDetailsProps> = ({
  section,
  userData,
  loading,
}) => {
  if (loading) return <SkeletonCards />;

  return (
    <div className="w-full space-y-5">
      {section === "personal" && (
        <>
          {!userData ? (
            <p className="text-center text-gray-400 py-8">
              לא נמצאו פרטים.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="שם פרטי" value={userData.fname} />
                <InfoCard label="שם משפחה" value={userData.lname} />
                <InfoCard label="טלפון" value={userData.phone} />
                <InfoCard label="אימייל" value={userData.email} />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                  onClick={async () => {
                    if (
                      window.confirm(
                        "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה הפיכה."
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
                            err &&
                            typeof err === "object" &&
                            "message" in err
                              ? (err as { message?: string }).message
                              : String(err);
                          alert("מחיקת החשבון נכשלה: " + (msg || err));
                        }
                      }
                    }
                  }}
                >
                  מחיקת חשבון
                </button>
              </div>
            </>
          )}
        </>
      )}

      {section === "payment" && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">בקרוב</p>
        </div>
      )}

      {section === "activity" && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">בקרוב</p>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
