"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuth, deleteUser } from "firebase/auth";
import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase";

const ISRAELI_BANKS = [
  { code: "12", name: "הפועלים" },
  { code: "10", name: "לאומי" },
  { code: "11", name: "דיסקונט" },
  { code: "20", name: "מזרחי טפחות" },
  { code: "31", name: "הבינלאומי" },
  { code: "14", name: "אוצר החייל" },
  { code: "17", name: "מרכנתיל" },
  { code: "09", name: "הדואר" },
  { code: "46", name: "מסד" },
  { code: "54", name: "ירושלים" },
];

interface UserData {
  fname?: string;
  lname?: string;
  phone?: string;
  email?: string;
  photoURL?: string;
  displayName?: string;
  paymentDetailsConfigured?: boolean;
  paymentDetails?: {
    bankName: string;
    branchNumber: string;
    accountNumber: string;
    accountHolderName: string;
  };
  [key: string]: unknown;
}

interface UserDetailsProps {
  section: string;
  userData: UserData | null;
  loading: boolean;
}

interface Transaction {
  id: string;
  ticketId: string;
  ticketTitle: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  status: string;
  createdAt: { seconds: number };
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Payment details form state
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [hasPaymentDetails, setHasPaymentDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState<{
    bankName: string;
    branchNumber: string;
    accountNumber: string;
    accountHolderName: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bankName, setBankName] = useState("");
  const [branchNumber, setBranchNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchPaymentDetails = useCallback(async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    setPaymentDetailsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/seller/payment-details", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHasPaymentDetails(data.hasPaymentDetails);
        if (data.paymentDetails) {
          setSavedDetails(data.paymentDetails);
          setBankName(data.paymentDetails.bankName);
          setBranchNumber(data.paymentDetails.branchNumber);
          setAccountNumber(data.paymentDetails.accountNumber);
          setAccountHolderName(data.paymentDetails.accountHolderName);
        }
      }
    } catch (err) {
      console.error("Error fetching payment details:", err);
    }
    setPaymentDetailsLoading(false);
  }, []);

  const fetchTransactions = useCallback(async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !db) return;

    setTransactionsLoading(true);
    try {
      const uid = user.uid;
      const txRef = collection(db, "transactions");

      const [buyerSnap, sellerSnap] = await Promise.all([
        getDocs(
          query(
            txRef,
            where("buyerId", "==", uid),
            orderBy("createdAt", "desc"),
          ),
        ),
        getDocs(
          query(
            txRef,
            where("sellerId", "==", uid),
            orderBy("createdAt", "desc"),
          ),
        ),
      ]);

      const txMap = new Map<string, Transaction>();
      buyerSnap.docs.forEach((d) =>
        txMap.set(d.id, { id: d.id, ...d.data() } as Transaction),
      );
      sellerSnap.docs.forEach((d) =>
        txMap.set(d.id, { id: d.id, ...d.data() } as Transaction),
      );

      const all = Array.from(txMap.values()).sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );
      setTransactions(all);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
    setTransactionsLoading(false);
  }, []);

  useEffect(() => {
    if (section === "payment" && userData) {
      fetchPaymentDetails();
    }
  }, [section, userData, fetchPaymentDetails]);

  useEffect(() => {
    if (section === "activity") {
      fetchTransactions();
    }
  }, [section, fetchTransactions]);

  const handleSavePaymentDetails = async () => {
    if (!bankName || !branchNumber || !accountNumber || !accountHolderName) {
      setPaymentError("יש למלא את כל השדות");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    setSavingDetails(true);
    setPaymentError(null);
    setPaymentSuccess(false);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/seller/payment-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bankName,
          branchNumber,
          accountNumber,
          accountHolderName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || "שגיאה בשמירת הפרטים");
        setSavingDetails(false);
        return;
      }

      setHasPaymentDetails(true);
      setSavedDetails({
        bankName,
        branchNumber,
        accountNumber,
        accountHolderName,
      });
      setIsEditing(false);
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 3000);
    } catch {
      setPaymentError("שגיאה בשמירת פרטי התשלום");
    }
    setSavingDetails(false);
  };

  if (loading) return <SkeletonCards />;

  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  return (
    <div className="w-full space-y-5">
      {section === "personal" && (
        <>
          {!userData ? (
            <p className="text-center text-gray-400 py-8">לא נמצאו פרטים.</p>
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
                  מחיקת חשבון
                </button>
              </div>
            </>
          )}
        </>
      )}

      {section === "payment" && (
        <div className="space-y-4" dir="rtl">
          {paymentDetailsLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="bg-gray-100 rounded-xl h-20" />
              <div className="bg-gray-100 rounded-xl h-12" />
            </div>
          ) : hasPaymentDetails && !isEditing ? (
            <>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <p className="text-sm font-semibold text-green-800">
                    פרטי חשבון בנק מוגדרים
                  </p>
                </div>
                {savedDetails && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2.5">
                      <span className="text-gray-400 block">בנק</span>
                      <span className="text-gray-800 font-medium">
                        {savedDetails.bankName}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                      <span className="text-gray-400 block">סניף</span>
                      <span className="text-gray-800 font-medium" dir="ltr">
                        {savedDetails.branchNumber}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                      <span className="text-gray-400 block">חשבון</span>
                      <span className="text-gray-800 font-medium" dir="ltr">
                        ****{savedDetails.accountNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-2.5">
                      <span className="text-gray-400 block">שם</span>
                      <span className="text-gray-800 font-medium">
                        {savedDetails.accountHolderName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {paymentSuccess && (
                <p className="text-green-600 text-xs text-center">
                  הפרטים נשמרו בהצלחה
                </p>
              )}

              <button
                className="w-full py-3 rounded-xl text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors"
                onClick={() => setIsEditing(true)}
              >
                עדכן פרטי חשבון
              </button>
            </>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1 text-center">
                  {isEditing ? "עדכן פרטי חשבון בנק" : "הוסף פרטי חשבון בנק"}
                </p>
                <p className="text-xs text-gray-500 mb-4 text-center">
                  הזן את פרטי חשבון הבנק שלך כדי לקבל תשלומים עבור כרטיסים
                  שנמכרו
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      בנק
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-[44px] border border-gray-300 rounded-lg px-3 text-sm bg-white"
                    >
                      <option value="">בחר בנק</option>
                      {ISRAELI_BANKS.map((bank) => (
                        <option key={bank.code} value={bank.name}>
                          {bank.name} ({bank.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        מספר סניף
                      </label>
                      <input
                        type="text"
                        value={branchNumber}
                        onChange={(e) =>
                          setBranchNumber(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="123"
                        maxLength={4}
                        className="w-full h-[44px] border border-gray-300 rounded-lg px-3 text-sm"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        מספר חשבון
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) =>
                          setAccountNumber(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="123456"
                        maxLength={13}
                        className="w-full h-[44px] border border-gray-300 rounded-lg px-3 text-sm"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      שם בעל החשבון
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="שם מלא כפי שמופיע בבנק"
                      className="w-full h-[44px] border border-gray-300 rounded-lg px-3 text-sm"
                    />
                  </div>
                </div>

                {paymentError && (
                  <p className="text-red-500 text-xs mt-2 text-center">
                    {paymentError}
                  </p>
                )}

                <button
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors mt-4"
                  onClick={handleSavePaymentDetails}
                  disabled={savingDetails}
                >
                  {savingDetails ? "שומר..." : "שמור פרטים"}
                </button>

                {isEditing && (
                  <button
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 mt-1"
                    onClick={() => {
                      setIsEditing(false);
                      setPaymentError(null);
                      if (savedDetails) {
                        setBankName(savedDetails.bankName);
                        setBranchNumber(savedDetails.branchNumber);
                        setAccountNumber(savedDetails.accountNumber);
                        setAccountHolderName(savedDetails.accountHolderName);
                      }
                    }}
                  >
                    ביטול
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {section === "activity" && (
        <div className="space-y-3">
          {transactionsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-20" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">אין פעולות עדיין</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const isBuyer = tx.buyerId === currentUid;
              const date = tx.createdAt
                ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString(
                    "he-IL",
                  )
                : "";
              return (
                <div
                  key={tx.id}
                  className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        isBuyer ? "bg-blue-500" : "bg-green-500"
                      }`}
                    >
                      {isBuyer ? "ק" : "מ"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {tx.ticketTitle || "כרטיס"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isBuyer ? "קניה" : "מכירה"} {date && `- ${date}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-sm font-bold ${
                        isBuyer ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isBuyer ? "-" : "+"}
                      {isBuyer ? tx.amount : tx.sellerPayout} ILS
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {tx.status}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetails;
