import { useState } from "react";
import { getAuth } from "firebase/auth";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

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

const StepFourUploadTicket: React.FC<UploadTicketInterface> = ({
  savedTickets = [],
  publishAllTickets,
  isPublishing,
  publishError,
  publishSuccess,
  publishWarning,
  handleClose,
  prevStep,
  canSplit,
  setCanSplit,
}) => {
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [bankName, setBankName] = useState("");
  const [branchNumber, setBranchNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  const checkPaymentAndPublish = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setPaymentError("יש להתחבר לחשבון כדי לפרסם כרטיסים");
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const idToken = await user.getIdToken();

      const res = await fetch("/api/seller/payment-details", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hasPaymentDetails) {
          setPaymentLoading(false);
          if (publishAllTickets) {
            await publishAllTickets();
          }
          return;
        }
      }

      setPaymentLoading(false);
      setShowPaymentForm(true);
    } catch {
      setPaymentLoading(false);
      setShowPaymentForm(true);
    }
  };

  const handleSavePaymentDetails = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    if (!bankName || !branchNumber || !accountNumber || !accountHolderName) {
      setPaymentError("יש למלא את כל השדות");
      return;
    }

    setSavingDetails(true);
    setPaymentError(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/seller/payment-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
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
        setPaymentError(data.error || "שגיאה בשמירת פרטי התשלום");
        setSavingDetails(false);
        return;
      }

      setShowPaymentForm(false);
      setSavingDetails(false);

      if (publishAllTickets) {
        await publishAllTickets();
      }
    } catch {
      setPaymentError("שגיאה בשמירת פרטי התשלום");
      setSavingDetails(false);
    }
  };

  const handlePublish = async () => {
    await checkPaymentAndPublish();
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="w-full max-w-[880px] mt-2 sm:mt-8">
        {/* Title and Subtitle */}
        <p className="text-lg sm:text-heading-5-desktop font-bold">
          סקירה סופית
        </p>
        <p className="text-sm sm:text-text-medium font-bold text-strongText">
          בדוק את כל הכרטיסים לפני הפרסום ({savedTickets.length} כרטיסים)
        </p>
      </div>

      {/* Bundle split preference — only shown for multi-ticket uploads and before publishing */}
      {savedTickets.length > 1 && !publishSuccess && !publishWarning && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-secondary/20 border border-secondary rounded-xl" dir="rtl">
          <p className="font-semibold text-strongText text-sm mb-3">
            הגדרת מכירה קבוצתית ({savedTickets.length} כרטיסים)
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/30 transition-colors">
              <input
                type="radio"
                name="canSplit"
                className="radio radio-primary radio-sm"
                checked={canSplit === true}
                onChange={() => setCanSplit?.(true)}
              />
              <div>
                <p className="text-sm font-semibold text-strongText">מכירה חלקית מותרת</p>
                <p className="text-xs text-mutedText">קונים יוכלו לבחור ולרכוש כרטיסים בודדים מהחבילה</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-secondary/30 transition-colors">
              <input
                type="radio"
                name="canSplit"
                className="radio radio-primary radio-sm"
                checked={canSplit === false}
                onChange={() => setCanSplit?.(false)}
              />
              <div>
                <p className="text-sm font-semibold text-strongText">חובה לרכוש את כל הכרטיסים</p>
                <p className="text-xs text-mutedText">הקונה יצטרך לרכוש את כל {savedTickets.length} הכרטיסים יחד</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Success Message Display */}
      {publishSuccess && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div className="flex-1">
              <p className="font-bold text-green-800 text-lg mb-2">
                הכרטיסים פורסמו בהצלחה!
              </p>
              <p className="text-green-700 text-sm whitespace-pre-line">
                {publishSuccess}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              className="btn w-full h-[48px] min-h-0 btn-primary bg-green-600 text-white hover:bg-green-700"
              onClick={handleClose}
            >
              סגור וחזור לדף הבית
            </button>
          </div>
        </div>
      )}

      {/* Warning Message Display (Orange) */}
      {publishWarning && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-lg mb-2">
                הכרטיסים ממתינים לאישור
              </p>
              <p className="text-orange-700 text-sm whitespace-pre-line">
                {publishWarning}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              className="btn w-full h-[48px] min-h-0 btn-primary bg-orange-600 text-white hover:bg-orange-700"
              onClick={handleClose}
            >
              סגור וחזור לדף הבית
            </button>
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {publishError && (
        <div className="mt-4 w-full max-w-[880px] p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🚫</div>
            <div className="flex-1">
              <p className="font-bold text-red-800 text-lg mb-2">
                שגיאה בפרסום הכרטיס
              </p>
              <p className="text-red-700 text-sm whitespace-pre-line">
                {publishError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Display all saved tickets - only show if not published yet */}
      {!publishSuccess && !publishWarning && (
        <>
          {/* Bank Details Form */}
          {showPaymentForm && (
            <div className="mt-4 w-full max-w-[880px] p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex flex-col gap-3" dir="rtl">
                <p className="font-bold text-blue-800 text-lg">
                  הוסף פרטי חשבון בנק
                </p>
                <p className="text-blue-700 text-sm">
                  כדי לקבל תשלום עבור הכרטיסים שלך, יש להזין את פרטי חשבון הבנק.
                  הפרטים ישמרו בצורה מאובטחת.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
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
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      מספר סניף
                    </label>
                    <input
                      type="text"
                      value={branchNumber}
                      onChange={(e) =>
                        setBranchNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="לדוגמה: 123"
                      maxLength={4}
                      className="w-full h-[44px] border border-gray-300 rounded-lg px-3 text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      מספר חשבון
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) =>
                        setAccountNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="לדוגמה: 123456"
                      maxLength={13}
                      className="w-full h-[44px] border border-gray-300 rounded-lg px-3 text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
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
                  <p className="text-red-500 text-sm">{paymentError}</p>
                )}

                <button
                  className="btn w-full h-[48px] min-h-0 bg-blue-600 text-white hover:bg-blue-700 font-bold mt-2"
                  onClick={handleSavePaymentDetails}
                  disabled={savingDetails}
                >
                  {savingDetails ? (
                    <div className="flex items-center gap-2">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span>שומר...</span>
                    </div>
                  ) : (
                    "שמור ופרסם כרטיסים"
                  )}
                </button>
                <button
                  className="text-blue-600 text-sm hover:underline"
                  onClick={() => setShowPaymentForm(false)}
                >
                  חזור
                </button>
              </div>
            </div>
          )}

          {!showPaymentForm && (
            <>
              <div className="mt-4 sm:mt-8 w-full max-w-[880px] space-y-4 max-h-[40vh] sm:max-h-[500px] overflow-y-auto">
                {savedTickets.map((ticket, index) => (
                  <MinimalCard
                    key={index}
                    price={ticket?.pricing?.askingPrice || 0}
                    priceBefore={ticket?.ticketDetails?.originalPrice}
                    title={
                      ticket?.ticketDetails?.artist ||
                      ticket?.ticketDetails?.title || // Fallback for backwards compatibility
                      ""
                    }
                    date={ticket?.ticketDetails?.date || ""}
                    venue={ticket?.ticketDetails?.venue}
                    seatLocation={
                      ticket?.ticketDetails?.isStanding
                        ? "עמידה"
                        : [
                            ticket?.ticketDetails?.section,
                            ticket?.ticketDetails?.row,
                            ticket?.ticketDetails?.seat,
                          ]
                            .filter(Boolean)
                            .join(" • ")
                    }
                    width="w-full"
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col items-center gap-3 mt-4 sm:mt-8 w-full max-w-[880px]">
                <button
                  className={`btn w-full h-[48px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
                    isPublishing || paymentLoading
                      ? "bg-gray-400 text-white cursor-wait"
                      : "bg-primary text-white hover:bg-primary/90"
                  }`}
                  onClick={handlePublish}
                  disabled={isPublishing || paymentLoading}
                >
                  {isPublishing ? (
                    <div className="flex items-center gap-2">
                      <div className="loading loading-spinner loading-sm"></div>
                      <span>מפרסם כרטיסים...</span>
                    </div>
                  ) : (
                    `פרסם ${savedTickets.length} כרטיסים`
                  )}
                </button>

                <button
                  type="button"
                  className="btn w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
                  onClick={() => prevStep && prevStep()}
                  disabled={isPublishing || paymentLoading}
                >
                  חזור
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StepFourUploadTicket;
