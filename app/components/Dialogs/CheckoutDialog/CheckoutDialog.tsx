"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
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
  ticket: TicketInfo | null;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  ticket,
}) => {
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // Auto-advance past auth step if already logged in
  useEffect(() => {
    if (isOpen && user && step === 1) {
      setStep(2);
    }
  }, [isOpen, user, step]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(user ? 2 : 1);
      setClientSecret(null);
      setPaymentDetails(null);
      setPaymentError(null);
      setTransactionComplete(false);
      setGuestInfo(null);
    }
  }, [isOpen, user]);

  const handleAuthComplete = useCallback(() => {
    setStep(2);
  }, []);

  const handleGuestCheckout = useCallback((info: GuestInfo) => {
    setGuestInfo(info);
    setStep(2);
  }, []);

  const handleProceedToPayment = useCallback(async () => {
    if (!ticket) return;
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

      const body: Record<string, unknown> = { ticketId: ticket.ticketId };
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
  }, [ticket, user, guestInfo]);

  const handlePaymentSuccess = useCallback(() => {
    setTransactionComplete(true);
    setStep(4);
  }, []);

  const handlePaymentError = useCallback((message: string) => {
    setPaymentError(message);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!ticket) return null;

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

  return (
    <AdjustableDialog
      isOpen={isOpen}
      onClose={handleClose}
      width="w-[880px]"
      heading={currentStep.heading}
      description={currentStep.description}
      topChildren={<ProgressBar step={step} totalSteps={4} />}
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
            ticket={ticket}
            platformFee={paymentDetails?.platformFee ?? 0}
            total={paymentDetails?.total ?? ticket.price}
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
          <CheckoutStepConfirmation ticket={ticket} onClose={handleClose} />
        )}
      </div>
    </AdjustableDialog>
  );
};

export default CheckoutDialog;
