"use client";

import React, { useEffect, useState } from "react";
import { getAuth, deleteUser } from "firebase/auth";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";

interface UserDetailsProps {
  section: string;
}

interface UserData {
  fname?: string;
  lname?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown; // For any additional fields
}

const UserDetails: React.FC<UserDetailsProps> = ({ section }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  if (loading) return <div>טוען פרטים...</div>;
  if (!userData) return <div>לא נמצאו פרטים.</div>;

  return (
    <div className="sm:w-3/4 xs:w-3/4 p-6 border-r-[3px] border-highlight sm:mr-16">
      {section === "personal" && (
        <div>
          <div className="grid grid-cols-2 sm:gap-14 xs:gap-6 gap-1 xs:mb-6 mb-2">
            <div>
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                שם פרטי
              </h4>
              <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8 ">
                {userData.fname}
              </p>
            </div>
            <div>
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                שם משפחה
              </h4>
              <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8">
                {userData.lname}
              </p>
            </div>
            {userData.phone && (
              <div>
                <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                  מספר טלפון
                </h4>
                <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8">
                  {userData.phone}
                </p>
              </div>
            )}
            <div>
              <h4 className="sm:text-heading-5-desktop xs:text-heading-5-mobile text-text-regular font-extrabold leading-10">
                אימייל
              </h4>
              <p className="sm:text-text-large xs:text-text-regular text-text-small text-strongText leading-8 ">
                {userData.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {section === "payment" && (
        <h2 className="text-2xl font-bold">פרטי תשלום</h2>
      )}
      {section === "activity" && (
        <h2 className="text-2xl font-bold">סיכום פעולות</h2>
      )}
      {section === "disconnect" && (
        <h2 className="text-2xl font-bold text-red-600">התנתקות</h2>
      )}
      {section === "delete" && (
        <div>
          <button
            className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-red-700 transition"
            onClick={async () => {
              if (
                window.confirm(
                  "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה הפיכה."
                )
              ) {
                const auth = getAuth();
                const user = auth.currentUser;
                if (user) {
                  try {
                    // Delete user document from Firestore
                    await deleteDoc(doc(db, "users", user.uid));
                    // Delete user from Firebase Auth
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
      )}
    </div>
  );
};

export default UserDetails;
