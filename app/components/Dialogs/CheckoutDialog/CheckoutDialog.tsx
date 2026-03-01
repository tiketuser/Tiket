"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const AuthDialog = dynamic(
  () => import("../AuthDialog/AuthDialog"),
  { ssr: false }
);
import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import ProgressBar from "../ProgressBar/ProgressBar";
import CheckoutStepAuth from "./CheckoutSteps/CheckoutStepAuth";
import type { GuestInfo } from "./CheckoutSteps/CheckoutStepAuth";
import CheckoutStepSummary from "./CheckoutSteps/CheckoutStepSummary";
import CheckoutStepPayment from "./CheckoutSteps/CheckoutStepPayment";
import CheckoutStepConfirmation from "./CheckoutSteps/CheckoutStepConfirmation";

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

const RESERVATION_SECONDS = 10 * 60; // 10 minutes

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  tickets,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
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
      await fetch("/api/stripe/release-reservation", {
        method: "POST",
        headers,
        body: JSON.stringify({ ticketIds: tickets.map((t) => t.ticketId) }),
      });
    } catch (err) {
      console.error("Failed to release reservation:", err);
    }
  }, [tickets, user]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Redirect to MyTickets after guest logs in post-purchase
  useEffect(() => {
    if (user && pendingMyTicketsRedirect) {
      setPendingMyTicketsRedirect(false);
      setAuthDialogOpen(false);
      router.push("/MyTickets");
    }
  }, [user, pendingMyTicketsRedirect, router]);

  // Auto-advance past auth step if already logged in
  useEffect(() => {
    if (isOpen && user && step === 1) {
      setStep(2);
    }
  }, [isOpen, user, step]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      stopTimer();
      setStep(user ? 2 : 1);
      setClientSecret(null);
      setPaymentDetails(null);
      setPaymentError(null);
      setTransactionComplete(false);
      setGuestInfo(null);
    }
  }, [isOpen, user, stopTimer]);

  // Start countdown when tickets become reserved (entering step 3)
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

  // When timer hits zero, release the reservation and close
  useEffect(() => {
    if (reservationSecondsLeft === 0) {
      stopTimer();
      releaseReservation().then(() => onClose());
    }
  }, [reservationSecondsLeft, releaseReservation, stopTimer, onClose]);

  const handleAuthComplete = useCallback(() => {
    setStep(2);
  }, []);

  const handleGuestCheckout = useCallback((info: GuestInfo) => {
    setGuestInfo(info);
    setStep(2);
  }, []);

  const handleProceedToPayment = useCallback(async () => {
    if (!tickets.length) return;
    if (!user && !guestInfo) return;

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
      if (guestInfo) {
        body.guestEmail = guestInfo.email;
        body.guestPhone = guestInfo.phone;
      }

      const response = await fetch("/api/stripe/create-payment-intent", {
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
  }, [tickets, user, guestInfo]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    stopTimer();
    setTransactionComplete(true);
    setStep(4);

    // Immediately persist the transaction server-side so MyTickets shows it right away.
    // The Stripe webhook is still the reliable fallback, but this prevents the race condition.
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        const idToken = await user.getIdToken();
        headers["Authorization"] = `Bearer ${idToken}`;
      }
      await fetch("/api/stripe/confirm-payment", {
        method: "POST",
        headers,
        body: JSON.stringify({ paymentIntentId }),
      });
    } catch (err) {
      console.error("confirm-payment call failed (webhook will handle it):", err);
    }
  }, [user, stopTimer]);

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

  if (!tickets.length) return null;

  const stepHeadings = [
    {
      heading: "התחבר או המשך כאורח",
      description: "התחבר, הירשם, או המשך כאורח לרכישה",
    },
    { heading: "סיכום הזמנה", description: "בדוק את פרטי הכרטיס לפני התשלום" },
    { heading: "תשלום", description: "הזן את פרטי התשלום" },
    { heading: "הרכישה הושלמה", description: "הכרטיס שלך מוכן" },
  ];

  const currentStep = stepHeadings[step - 1];

  const timerDisplay = reservationSecondsLeft !== null
    ? `${String(Math.floor(reservationSecondsLeft / 60)).padStart(2, "0")}:${String(reservationSecondsLeft % 60).padStart(2, "0")}`
    : null;

  const isTimerUrgent = reservationSecondsLeft !== null && reservationSecondsLeft <= 60;

  return (
    <>
    <AdjustableDialog
      isOpen={isOpen}
      onClose={handleClose}
      width="w-[880px]"
      heading={currentStep.heading}
      description={currentStep.description}
      topChildren={
        <div className="flex flex-col gap-2 w-full">
          <ProgressBar step={step} totalSteps={4} />
          {timerDisplay && (
            <div className={`flex items-center justify-center gap-1.5 text-sm font-semibold ${isTimerUrgent ? "text-red-600 animate-pulse" : "text-orange-500"}`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
              </svg>
              הכרטיס שמור עבורך עוד {timerDisplay} דקות
            </div>
          )}
        </div>
      }
    >
      <div className="w-full max-w-[604px] mx-auto mt-4 sm:mt-6">
        {step === 1 && (
          <CheckoutStepAuth
            onAuthComplete={handleAuthComplete}
            onGuestCheckout={handleGuestCheckout}
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
    </AdjustableDialog>

    <AuthDialog
      isOpen={isAuthDialogOpen}
      onClose={() => setAuthDialogOpen(false)}
    />
    </>
  );
};

export default CheckoutDialog;
