"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const AuthDialog = dynamic(
  () => import("../AuthDialog/AuthDialog"),
  { ssr: false }
);
import MobileAuthSheet from "../../mobile/MobileAuthSheet";
import type { GuestInfo } from "../../mobile/MobileAuthSheet";
import CheckoutStepPayment from "./CheckoutSteps/CheckoutStepPayment";
import CheckoutStepConfirmation from "./CheckoutSteps/CheckoutStepConfirmation";
import {
  CountdownBar,
  TicketStub,
  PaySummary,
  TermsRow,
  PayFooter,
} from "./CheckoutDesign";
import { Icon } from "../../mobile/Icon";
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
  /* Optional metadata for the design ticket stub */
  imageUrl?: string;
  time?: string;
  section?: string;
  row?: number | null;
  seat?: number | null;
  isStanding?: boolean;
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: TicketInfo[];
}

const RESERVATION_SECONDS = 10 * 60;

// Steps: 1 = auth, 2 = payment ("תשלום" design screen), 3 = confirmation
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingMyTicketsRedirect, setPendingMyTicketsRedirect] = useState(false);
  const [reservationSecondsLeft, setReservationSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intentRequested = useRef(false);

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
      setTermsAccepted(false);
      intentRequested.current = false;
    }
  }, [isOpen, user, stopTimer]);

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

  const createPaymentIntent = useCallback(async () => {
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
    } catch (error) {
      console.error("Payment intent error:", error);
      setPaymentError("שגיאה בהתחברות לשרת התשלומים");
    }
  }, [tickets, user, guestToken]);

  // The design shows "הכרטיס שמור לך" from the moment checkout opens —
  // reserve (create the intent) as soon as we know who's buying.
  useEffect(() => {
    if (
      isOpen &&
      step === 2 &&
      !clientSecret &&
      (user || guestToken) &&
      !intentRequested.current
    ) {
      intentRequested.current = true;
      void createPaymentIntent();
    }
  }, [isOpen, step, clientSecret, user, guestToken, createPaymentIntent]);

  // Reservation countdown runs while a live payment intent exists
  useEffect(() => {
    if (isOpen && step === 2 && clientSecret && !transactionComplete) {
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
  }, [isOpen, step, clientSecret, transactionComplete]);

  useEffect(() => {
    if (reservationSecondsLeft === 0) {
      stopTimer();
      releaseReservation().then(() => onClose());
    }
  }, [reservationSecondsLeft, releaseReservation, stopTimer, onClose]);

  const handlePaymentSuccess = useCallback(async (paymentIntentId: string) => {
    stopTimer();
    setTransactionComplete(true);
    setStep(3);

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

  const handleRetryIntent = useCallback(() => {
    setPaymentError(null);
    void createPaymentIntent();
  }, [createPaymentIntent]);

  const handleClose = useCallback(async () => {
    stopTimer();
    if (clientSecret && !transactionComplete) {
      await releaseReservation();
    }
    onClose();
  }, [onClose, clientSecret, transactionComplete, releaseReservation, stopTimer]);

  if (!tickets.length || !rendered) return null;

  const timerDisplay = reservationSecondsLeft !== null
    ? `${String(Math.floor(reservationSecondsLeft / 60)).padStart(2, "0")}:${String(reservationSecondsLeft % 60).padStart(2, "0")}`
    : null;

  const isTimerUrgent = reservationSecondsLeft !== null && reservationSecondsLeft <= 60;

  const subtotal = tickets.reduce((s, t) => s + t.price, 0);
  const payTotal = paymentDetails?.total ?? subtotal;

  const payTop = (
    <>
      {timerDisplay && <CountdownBar display={timerDisplay} urgent={isTimerUrgent} />}
      <TicketStub tickets={tickets} />
    </>
  );

  const paySummary = (
    <PaySummary
      tickets={tickets}
      platformFee={paymentDetails?.platformFee ?? 0}
      total={payTotal}
    />
  );

  // Step 1: the design's auth sheet slides up over the blurred page —
  // no full-screen checkout chrome until the buyer is known.
  if (step === 1) {
    return (
      <MobileAuthSheet
        isOpen={isOpen}
        onClose={handleClose}
        onSuccess={handleAuthComplete}
        responsive
        contextLabel="התחבר כדי להשלים את הרכישה בבטחה"
        onGuest={handleGuestCheckout}
        guestError={paymentError}
      />
    );
  }

  return (
    <>
      <div
        className={`tk-mobile fixed inset-0 z-50 flex items-stretch sm:items-center justify-center transition-all duration-300 ${
          visible ? "bg-black/55 backdrop-blur-sm" : "bg-black/0"
        }`}
      >
        <div
          className={`relative w-full h-full sm:h-auto sm:w-[560px] sm:max-w-[92vw] sm:max-h-[88vh] flex flex-col sm:rounded-[20px] shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
            visible
              ? "translate-y-0 sm:scale-100 opacity-100"
              : "translate-y-12 sm:translate-y-0 sm:scale-95 opacity-0"
          }`}
          style={{ background: "var(--tk-bg)", color: "var(--tk-ink)" }}
          dir="rtl"
        >
          {/* Header — back · תשלום · מאובטח */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              paddingTop: "calc(14px + env(safe-area-inset-top, 0px))",
              borderBottom: "1px solid var(--tk-line)",
            }}
          >
            <button
              onClick={handleClose}
              aria-label="חזרה"
              className="transition-transform active:scale-95"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: "var(--tk-paper)",
                border: "1px solid var(--tk-line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon.chev size={16} />
            </button>
            <div style={{ fontSize: 15, fontWeight: 700 }}>תשלום</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "var(--tk-blue)",
                fontWeight: 600,
              }}
            >
              <Icon.lock size={12} color="var(--tk-blue)" /> מאובטח
            </div>
          </div>

          {step === 2 &&
            (clientSecret ? (
              <CheckoutStepPayment
                key={clientSecret}
                clientSecret={clientSecret}
                total={payTotal}
                termsAccepted={termsAccepted}
                onTermsChange={setTermsAccepted}
                topSlot={payTop}
                summarySlot={paySummary}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto" style={{ padding: "16px 18px" }}>
                  {payTop}
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    אופן תשלום
                  </div>
                  {paymentError ? (
                    <div
                      style={{
                        border: "1px solid rgba(196,55,62,0.18)",
                        background: "rgba(196,55,62,0.08)",
                        borderRadius: 12,
                        padding: "16px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#C4373E", marginBottom: 10 }}>
                        {paymentError}
                      </div>
                      <button
                        onClick={handleRetryIntent}
                        style={{
                          padding: "8px 18px",
                          borderRadius: 999,
                          border: "none",
                          background: "var(--tk-ink)",
                          color: "var(--tk-bg)",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        נסה שוב
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        border: "1px dashed var(--tk-line-strong)",
                        borderRadius: 12,
                        padding: "22px 16px",
                        textAlign: "center",
                        fontSize: 12,
                        color: "var(--tk-muted)",
                      }}
                    >
                      מכין תשלום מאובטח…
                    </div>
                  )}
                  {paySummary}
                  <TermsRow checked={termsAccepted} onChange={setTermsAccepted} />
                </div>
                <PayFooter total={payTotal} disabled />
              </div>
            ))}

          {step === 3 && (
            <div className="flex-1 overflow-y-auto" style={{ padding: "20px 18px 24px" }}>
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
            </div>
          )}
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
