"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const AuthDialog = dynamic(
  () => import("../AuthDialog/AuthDialog"),
  { ssr: false }
);
import CheckoutStepAuth from "./CheckoutSteps/CheckoutStepAuth";
import type { GuestInfo } from "./CheckoutSteps/CheckoutStepAuth";
import CheckoutStepSummary from "./CheckoutSteps/CheckoutStepSummary";
import CheckoutStepPayment from "./CheckoutSteps/CheckoutStepPayment";
import CheckoutStepConfirmation from "./CheckoutSteps/CheckoutStepConfirmation";
import { apiFetch } from "@/lib/platform";

export interface TicketInfo {
  ticketId: string;
  title: string;
  date: string;
  venue: string;
  seatLocation: string;
  price: number;
  originalPrice?: number;
  sellerId: string;
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: TicketInfo[];
}

const RESERVATION_SECONDS = 10 * 60;

const STEP_HEADINGS = [
  { heading: "התחבר או המשך כאורח", description: "התחבר, הירשם, או המשך כאורח לרכישה" },
  { heading: "סיכום הזמנה", description: "בדוק את פרטי הכרטיס לפני התשלום" },
  { heading: "תשלום", description: "הזן את פרטי התשלום" },
  { heading: "הרכישה הושלמה", description: "הכרטיס שלך מוכן" },
];

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  tickets,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    total: number;
    platformFee: number;
    ticketPrice: number;
  } | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingMyTicketsRedirect, setPendingMyTicketsRedirect] = useState(false);
  const [reservationSecondsLeft, setReservationSecondsLeft] = useState<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation state for the sheet/modal
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      document.body.classList.add("no-doc-scroll");
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 280);
      document.body.classList.remove("no-doc-scroll");
      return () => clearTimeout(t);
    }
    return () => {
      document.body.classList.remove("no-doc-scroll");
    };
  }, [isOpen]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setReservationSecondsLeft(null);
  }, []);

  const releaseReservation = useCallback(async () => {
    if (!tickets.length) return;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        const idToken = await user.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }
      await apiFetch("/api/stripe/release-reservation", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ticketIds: tickets.map((t) => t.ticketId),
          ...(guestToken && { guestToken }),
        }),
      });
    } catch (err) {
      console.error("Failed to release reservation:", err);
    }
  }, [tickets, user, guestToken]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && pendingMyTicketsRedirect) {
      setPendingMyTicketsRedirect(false);
      setAuthDialogOpen(false);
      router.push("/MyTickets");
    }
  }, [user, pendingMyTicketsRedirect, router]);

  useEffect(() => {
    if (isOpen && user && step === 1) {
      setPaymentError(null);
      setStep(2);
    }
  }, [isOpen, user, step]);

  useEffect(() => {
    if (!isOpen) {
      stopTimer();
      setStep(user ? 2 : 1);
      setClientSecret(null);
      setPaymentDetails(null);
      setPaymentError(null);
      setTransactionComplete(false);
      setGuestToken(null);
    }
  }, [isOpen, user, stopTimer]);

  useEffect(() => {
    if (step === 3 && !transactionComplete) {
      setReservationSecondsLeft(RESERVATION_SECONDS);
      timerRef.current = setInterval(() => {
        setReservationSecondsLeft((prev) => {
          if (prev === null || prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    } else {
      stopTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (reservationSecondsLeft === 0) {
      stopTimer();
      releaseReservation().then(() => onClose());
    }
  }, [reservationSecondsLeft, releaseReservation, stopTimer, onClose]);

  const handleAuthComplete = useCallback(() => {
    setPaymentError(null);
    setStep(2);
  }, []);

  const handleGuestCheckout = useCallback(async (info: GuestInfo) => {
    setPaymentError(null);
    try {
      const response = await apiFetch("/api/guest-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: info.email, phone: info.phone }),
      });
      const data = await response.json();
      if (!response.ok || !data.guestToken) {
        if (response.status === 503) {
          setPaymentError("שירות קניית האורח אינו זמין כעת. נסה שוב בעוד מספר דקות או התחבר/הירשם.");
        } else {
          setPaymentError(data.error || "שגיאה בפתיחת מושב אורח");
        }
        return;
      }
      setGuestToken(data.guestToken);
      setStep(2);
    } catch (err) {
      console.error("guest-token error:", err);
      setPaymentError("שגיאה בהתחברות לשרת");
    }
  }, []);

  const handleProceedToPayment = useCallback(async () => {
    if (!tickets.length) return;
    if (!user && !guestToken) return;

    setPaymentError(null);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (user) {
        const idToken = await user.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const body: Record<string, unknown> = { ticketIds: tickets.map((t) => t.ticketId) };
      if (guestToken) {
        body.guestToken = guestToken;
      }

      const response = await apiFetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setPaymentError(data.error || "שגיאה ביצירת התשלום");
        return;
      }

      setClientSecret(data.clientSecret);
      setPaymentDetails({
        total: data.total,
        platformFee: data.platformFee,
        ticketPrice: data.ticketPrice,
      });
      setStep(3);
    } catch (error) {
      console.error("Payment intent error:", error);
      setPaymentError("שגיאה בהתחברות לשרת התשלומים");
    }
  }, [tickets, user, guestToken]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    stopTimer();
    setTransactionComplete(true);
    setStep(4);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        const idToken = await user.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }
      await apiFetch("/api/stripe/confirm-payment", {
        method: "POST",
        headers,
        body: JSON.stringify({
          paymentIntentId,
          ...(guestToken && { guestToken }),
        }),
      });
    } catch (err) {
      console.error("confirm-payment call failed (webhook will handle it):", err);
    }
  }, [user, stopTimer, guestToken]);

  const handlePaymentError = useCallback((message: string) => {
    setPaymentError(message);
  }, []);

  const handleClose = useCallback(async () => {
    stopTimer();
    if (step >= 3 && !transactionComplete) {
      await releaseReservation();
    }
    onClose();
  }, [onClose, step, transactionComplete, releaseReservation, stopTimer]);

  if (!tickets.length || !rendered) return null;

  const currentStep = STEP_HEADINGS[step - 1];

  const timerDisplay = reservationSecondsLeft !== null
    ? `${String(Math.floor(reservationSecondsLeft / 60)).padStart(2, "0")}:${String(reservationSecondsLeft % 60).padStart(2, "0")}`
    : null;

  const isTimerUrgent = reservationSecondsLeft !== null && reservationSecondsLeft <= 60;

  return (
    <>
      <div
        className={`tk-mobile fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${
          visible ? "bg-black/55 backdrop-blur-sm" : "bg-black/0"
        }`}
      >
        <div
          className={`relative w-full sm:w-[560px] sm:max-w-[92vw] max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-[24px] sm:rounded-[20px] shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
            visible
              ? "translate-y-0 sm:scale-100 opacity-100"
              : "translate-y-12 sm:translate-y-0 sm:scale-95 opacity-0"
          }`}
          style={{ background: "var(--tk-paper)", color: "var(--tk-ink)" }}
        >
          {/* Mobile grab handle */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: "var(--tk-line-strong)" }}
            />
          </div>

          {/* Header */}
          <div
            className="relative px-5 sm:px-8 pt-2 sm:pt-7 pb-4"
            style={{ borderBottom: "1px solid var(--tk-line)" }}
          >
            <button
              onClick={handleClose}
              aria-label="סגור"
              className="absolute top-2 sm:top-5 left-3 sm:left-5 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95"
              style={{
                background: "var(--tk-bg)",
                border: "1px solid var(--tk-line)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="var(--tk-ink)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Stepper bars */}
            <div
              className="flex items-center gap-1.5 mb-4 mx-auto"
              dir="ltr"
              style={{ maxWidth: 240 }}
            >
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className="flex-1 rounded-full transition-colors duration-300"
                  style={{
                    height: 3,
                    background: s <= step ? "var(--tk-ink)" : "var(--tk-line)",
                  }}
                />
              ))}
            </div>

            <div
              className="tk-mono text-center"
              style={{
                fontSize: 10,
                letterSpacing: "0.1em",
                color: "var(--tk-muted)",
              }}
            >
              שלב {step} / 4
            </div>
            <h2
              className="text-center mt-1"
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--tk-ink)",
                lineHeight: 1.2,
              }}
            >
              {currentStep.heading}
            </h2>
            <p
              className="text-center mt-1"
              style={{ fontSize: 13, color: "var(--tk-muted)" }}
            >
              {currentStep.description}
            </p>

            {timerDisplay && (
              <div
                className="flex items-center justify-center gap-1.5 mt-3"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isTimerUrgent ? "#C4373E" : "var(--tk-blue-ink)",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={isTimerUrgent ? "animate-pulse" : ""}
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M8 4.5V8l2.5 1.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="tk-mono">{timerDisplay}</span>
                <span>הכרטיס שמור עבורך</span>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div
            className="overflow-y-auto flex-1 px-5 sm:px-8 py-5 sm:py-6"
            dir="rtl"
          >
            {step === 1 && (
              <CheckoutStepAuth
                onAuthComplete={handleAuthComplete}
                onGuestCheckout={handleGuestCheckout}
                externalError={paymentError}
              />
            )}

            {step === 2 && (
              <CheckoutStepSummary
                tickets={tickets}
                platformFee={paymentDetails?.platformFee ?? 0}
                total={paymentDetails?.total ?? tickets.reduce((s, t) => s + t.price, 0)}
                onProceed={handleProceedToPayment}
                error={paymentError}
              />
            )}

            {step === 3 && clientSecret && (
              <CheckoutStepPayment
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}

            {step === 4 && (
              <CheckoutStepConfirmation
                tickets={tickets}
                onClose={handleClose}
                isGuest={!user}
                onLoginRequest={() => {
                  handleClose();
                  setPendingMyTicketsRedirect(true);
                  setTimeout(() => setAuthDialogOpen(true), 300);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </>
  );
};

export default CheckoutDialog;
