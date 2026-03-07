"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuth, deleteUser } from "firebase/auth";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
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

interface UploadedTicket {
  id: string;
  artist: string;
  venue: string;
  date: string;
  askingPrice: number;
  status: string;
  createdAt: { seconds: number };
}

type ActivityItem =
  | { kind: "transaction"; data: Transaction }
  | { kind: "upload"; data: UploadedTicket };

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
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
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
  const [showRemovePaymentConfirm, setShowRemovePaymentConfirm] =
    useState(false);
  const [removingPayment, setRemovingPayment] = useState(false);

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
      const ticketsRef = collection(db, "tickets");

      const [buyerSnap, sellerSnap, uploadsSnap] = await Promise.all([
        getDocs(query(txRef, where("buyerId", "==", uid))),
        getDocs(query(txRef, where("sellerId", "==", uid))),
        getDocs(query(ticketsRef, where("sellerId", "==", uid))),
      ]);

      const txMap = new Map<string, Transaction>();
      buyerSnap.docs.forEach((d) =>
        txMap.set(d.id, { id: d.id, ...d.data() } as Transaction),
      );
      sellerSnap.docs.forEach((d) =>
        txMap.set(d.id, { id: d.id, ...d.data() } as Transaction),
      );

      const txList = Array.from(txMap.values());

      // Fetch artist name from linked ticket docs
      const uniqueTicketIds = [
        ...new Set(txList.map((tx) => tx.ticketId).filter(Boolean)),
      ];
      const ticketInfoMap = new Map<string, { artist?: string }>();
      if (uniqueTicketIds.length > 0 && db) {
        const snaps = await Promise.all(
          uniqueTicketIds.map((id) => getDoc(doc(db!, "tickets", id))),
        );
        snaps.forEach((snap) => {
          if (snap.exists())
            ticketInfoMap.set(snap.id, { artist: snap.data().artist });
        });
      }

      const txItems: ActivityItem[] = txList.map((tx) => ({
        kind: "transaction",
        data: {
          ...tx,
          ticketTitle: ticketInfoMap.get(tx.ticketId)?.artist || tx.ticketTitle,
        },
      }));

      const uploadItems: ActivityItem[] = uploadsSnap.docs.map((d) => ({
        kind: "upload",
        data: { id: d.id, ...d.data() } as UploadedTicket,
      }));

      const all = [...txItems, ...uploadItems].sort((a, b) => {
        const aTs =
          a.kind === "transaction"
            ? a.data.createdAt?.seconds
            : (a.data as UploadedTicket).createdAt?.seconds;
        const bTs =
          b.kind === "transaction"
            ? b.data.createdAt?.seconds
            : (b.data as UploadedTicket).createdAt?.seconds;
        return (bTs || 0) - (aTs || 0);
      });

      setActivityItems(all);
    } catch (err) {
      console.error("Error fetching activity:", err);
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
              <button
                className="w-full py-3 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-colors"
                onClick={() => setShowRemovePaymentConfirm(true)}
              >
                הסר פרטי חשבון
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
          ) : activityItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">אין פעולות עדיין</p>
            </div>
          ) : (
            activityItems.map((item) => {
              if (item.kind === "transaction") {
                const tx = item.data;
                const isBuyer = tx.buyerId === currentUid;
                const date = tx.createdAt
                  ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString(
                      "he-IL",
                    )
                  : "";
                const statusLabel =
                  tx.status === "completed"
                    ? "הושלם"
                    : tx.status === "pending"
                      ? "ממתין"
                      : tx.status === "escrow"
                        ? "בנאמנות"
                        : tx.status;

                return (
                  <div
                    key={`tx-${tx.id}`}
                    className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-secondary/40 bg-white shadow-xxsmall"
                    dir="rtl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isBuyer
                            ? "bg-primary/10 text-primary"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {isBuyer ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <path d="M16 10a4 4 0 0 1-8 0" />
                          </svg>
                        ) : (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-text-small font-bold text-strongText leading-tight">
                          {tx.ticketTitle || "כרטיס"}
                        </p>
                        <p className="text-text-extra-small text-mutedText mt-0.5">
                          {isBuyer ? "רכישה" : "מכירה"}
                          {date && ` · ${date}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-left shrink-0 flex flex-col items-end gap-1">
                      <p
                        className={`text-text-small font-extrabold ${isBuyer ? "text-primary" : "text-green-600"}`}
                      >
                        ₪ {isBuyer ? tx.amount : tx.sellerPayout}
                        {isBuyer ? "−" : "+"}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          tx.status === "completed"
                            ? "bg-green-50 text-green-700"
                            : "bg-secondary/30 text-highlight"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              }

              // Upload item
              const up = item.data as UploadedTicket;
              const date = up.createdAt
                ? new Date(up.createdAt.seconds * 1000).toLocaleDateString(
                    "he-IL",
                  )
                : "";
              const statusLabel =
                up.status === "available"
                  ? "זמין למכירה"
                  : up.status === "pending_approval" ||
                      up.status === "needs_review"
                    ? "ממתין לאישור"
                    : up.status === "sold"
                      ? "נמכר"
                      : up.status === "rejected"
                        ? "נדחה"
                        : up.status;
              const statusStyle =
                up.status === "available"
                  ? "bg-green-50 text-green-700"
                  : up.status === "sold"
                    ? "bg-primary/10 text-primary"
                    : up.status === "rejected"
                      ? "bg-red-50 text-red-600"
                      : "bg-secondary/30 text-highlight";

              return (
                <div
                  key={`up-${up.id}`}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-secondary/40 bg-white shadow-xxsmall"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary/30 text-highlight shrink-0">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-text-small font-bold text-strongText leading-tight">
                        {up.artist || "כרטיס"}
                      </p>
                      <p className="text-text-extra-small text-mutedText mt-0.5">
                        העלאת כרטיס{date && ` · ${date}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-left shrink-0 flex flex-col items-end gap-1">
                    <p className="text-text-small font-extrabold text-strongText">
                     ₪ {up.askingPrice} 
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          <div className="pt-4 border-t border-gray-100 text-center">
            <button
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
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
        </div>
      )}
      {showRemovePaymentConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          dir="rtl"
        >
          <div className="bg-white rounded-xl shadow-large p-6 mx-4 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-lg font-bold text-strongText text-center">
              הסרת פרטי חשבון
            </h2>
            <p className="text-sm text-mutedText text-center">
              האם אתה בטוח שברצונך להסיר את פרטי חשבון הבנק? לא ניתן יהיה לקבל
              תשלומים עבור כרטיסים שנמכרו עד להוספתם מחדש.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowRemovePaymentConfirm(false)}
                disabled={removingPayment}
                className="btn btn-outline rounded-md min-h-0 h-10 px-5 text-sm font-medium flex-1"
              >
                חזרה
              </button>
              <button
                disabled={removingPayment}
                className="btn btn-primary rounded-md min-h-0 h-10 px-5 text-white text-sm font-medium flex-1"
                onClick={async () => {
                  setRemovingPayment(true);
                  const user = getAuth().currentUser;
                  if (user) {
                    const token = await user.getIdToken();
                    const res = await fetch("/api/seller/payment-details", {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      setHasPaymentDetails(false);
                      setSavedDetails(null);
                      setBankName("");
                      setBranchNumber("");
                      setAccountNumber("");
                      setAccountHolderName("");
                    }
                  }
                  setRemovingPayment(false);
                  setShowRemovePaymentConfirm(false);
                }}
              >
                {removingPayment ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "כן, הסר"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
