import { useState } from "react";
import { getAuth } from "firebase/auth";
import { UploadTicketInterface } from "./UploadTicketInterface.types";

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

const StepFourBankDetails: React.FC<UploadTicketInterface> = ({
  nextStep,
  prevStep,
}) => {
  const [bankOpen, setBankOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [branchNumber, setBranchNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!bankName || !branchNumber || !accountNumber || !accountHolderName) {
      setError("יש למלא את כל השדות");
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    setSaving(true);
    setError(null);

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
        setError(data.error || "שגיאה בשמירת פרטי התשלום");
        setSaving(false);
        return;
      }

      nextStep?.();
    } catch {
      setError("שגיאה בשמירת פרטי התשלום");
      setSaving(false);
    }
  };

  return (
    <div className="px-4 sm:px-0" dir="rtl">
      <div className="w-full max-w-[880px] mt-2 sm:mt-8">
        <p className="text-lg sm:text-heading-5-desktop font-bold">
          פרטי חשבון בנק
        </p>
        <p className="text-sm sm:text-text-medium font-bold text-strongText mt-1">
          כדי לקבל תשלום עבור הכרטיסים, יש להזין את פרטי חשבון הבנק. הפרטים
          ישמרו בצורה מאובטחת.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {/* Bank custom dropdown */}
          <div className="relative">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              בנק
            </label>
            <button
              type="button"
              onClick={() => setBankOpen((o) => !o)}
              className="w-full h-[44px] pr-4 pl-4 text-sm border border-gray-300 rounded-lg bg-white flex items-center justify-between"
              dir="rtl"
            >
              <span className={bankName ? "text-gray-900" : "text-gray-400"}>
                {bankName
                  ? `${bankName} (${ISRAELI_BANKS.find((b) => b.name === bankName)?.code})`
                  : "בחר בנק"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${bankOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {bankOpen && (
              <ul
                className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-medium overflow-hidden max-h-52 overflow-y-auto"
                dir="rtl"
              >
                {ISRAELI_BANKS.map((bank) => (
                  <li
                    key={bank.code}
                    onClick={() => {
                      setBankName(bank.name);
                      setBankOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                      bankName === bank.name
                        ? "bg-primary text-white font-medium"
                        : "text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {bank.name} ({bank.code})
                  </li>
                ))}
              </ul>
            )}
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
              dir="rtl"
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
              dir="rtl"
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
              dir="rtl"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex flex-col items-center gap-3 mt-6 max-w-[400px] mx-auto w-full">
          <button
            className="btn w-full h-[48px] min-h-0 bg-primary text-white hover:bg-primary/90 font-bold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="loading loading-spinner loading-sm"></div>
                <span>שומר...</span>
              </div>
            ) : (
              "שמור והמשך"
            )}
          </button>

          <button
            type="button"
            className="btn w-full h-[48px] min-h-0 bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
            onClick={() => prevStep?.()}
            disabled={saving}
          >
            חזור
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepFourBankDetails;
