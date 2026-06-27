"use client";

import React, { useState } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../../../../../lib/stripe-client";

interface CheckoutStepPaymentProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

const PaymentForm: React.FC<{
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExpressConfirm = async () => {
    if (!stripe || !elements) return;

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe/payment-complete`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      const message =
        confirmError.type === "card_error" ||
        confirmError.type === "validation_error"
          ? confirmError.message || "שגיאת תשלום"
          : "שגיאה לא צפויה בתשלום";
      setError(message);
      onError(message);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError("התשלום לא הושלם. נסה שוב.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "שגיאה בטופס התשלום");
      setIsProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe/payment-complete`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      const message =
        confirmError.type === "card_error" ||
        confirmError.type === "validation_error"
          ? confirmError.message || "שגיאת תשלום"
          : "שגיאה לא צפויה בתשלום";
      setError(message);
      onError(message);
      setIsProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      setError("התשלום לא הושלם. נסה שוב.");
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 w-full"
      dir="rtl"
    >
      <ExpressCheckoutElement
        onConfirm={handleExpressConfirm}
        options={{
          paymentMethods: {
            applePay: "always",
            googlePay: "always",
            link: "never",
          },
          buttonHeight: 50,
        }}
      />

      <div className="flex items-center gap-3" dir="ltr">
        <div className="flex-1" style={{ height: 1, background: "var(--tk-line)" }} />
        <span className="tk-mono" style={{ fontSize: 10, color: "var(--tk-muted)" }}>
          או שלם בכרטיס
        </span>
        <div className="flex-1" style={{ height: 1, background: "var(--tk-line)" }} />
      </div>

      <div
        dir="rtl"
        style={{
          background: "var(--tk-bg)",
          border: "1px solid var(--tk-line)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {error && (
        <p
          className="text-center"
          style={{
            fontSize: 12,
            color: "#C4373E",
            background: "rgba(196,55,62,0.08)",
            border: "1px solid rgba(196,55,62,0.18)",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="relative w-full overflow-hidden transition-transform active:scale-[0.99] disabled:cursor-not-allowed"
        style={{
          height: 52,
          background: !stripe || isProcessing ? "var(--tk-line-strong)" : "var(--tk-ink)",
          color: !stripe || isProcessing ? "var(--tk-muted)" : "var(--tk-lime)",
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          letterSpacing: "-0.01em",
        }}
      >
        {isProcessing && (
          <span className="absolute inset-0 overflow-hidden" style={{ borderRadius: 14 }}>
            <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </span>
        )}
        <span className="relative flex items-center justify-center gap-2">
          {isProcessing && (
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isProcessing ? "מעבד תשלום…" : "שלם עכשיו"}
        </span>
      </button>

      <div
        className="flex items-center justify-center gap-1.5"
        style={{ fontSize: 11, color: "var(--tk-muted)" }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="7" width="10" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        תשלום מאובטח · Stripe
      </div>
    </form>
  );
};

const CheckoutStepPayment: React.FC<CheckoutStepPaymentProps> = ({
  clientSecret,
  onSuccess,
  onError,
}) => {
  const stripePromise = getStripe();

  return (
    <div className="w-full">
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#0A0A0A",
              colorBackground: "#F5F1E8",
              colorText: "#0A0A0A",
              colorTextSecondary: "#6E6A60",
              colorDanger: "#C4373E",
              fontFamily: "Heebo, Assistant, sans-serif",
              borderRadius: "10px",
              spacingUnit: "4px",
            },
            rules: {
              ".Input": {
                border: "1px solid #E4DFD2",
                backgroundColor: "#FBF8F1",
              },
              ".Input:focus": {
                border: "1px solid #0A0A0A",
                boxShadow: "0 0 0 1px #0A0A0A",
              },
              ".Tab": {
                border: "1px solid #E4DFD2",
                backgroundColor: "#FBF8F1",
              },
              ".Tab--selected": {
                border: "1px solid #0A0A0A",
                backgroundColor: "#FBF8F1",
              },
              ".Label": {
                color: "#6E6A60",
              },
            },
          },
          locale: "he",
        }}
      >
        <PaymentForm onSuccess={onSuccess} onError={onError} />
      </Elements>
    </div>
  );
};

export default CheckoutStepPayment;
