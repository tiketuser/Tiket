"use client";

import React, { useState } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
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

  const handleExpressConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent
  ) => {
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
      className="flex flex-col gap-4 sm:gap-6 w-full"
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
          buttonHeight: 48,
        }}
      />

      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400 whitespace-nowrap">או שלם בכרטיס</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div dir="rtl">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="relative w-full h-[48px] sm:h-[56px] bg-primary text-white rounded-lg font-bold text-text-regular sm:text-heading-5-desktop hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        {isProcessing && (
          <span className="absolute inset-0 overflow-hidden rounded-lg">
            <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </span>
        )}
        <span className="relative flex items-center justify-center gap-2">
          {isProcessing && (
            <svg className="animate-spin w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {isProcessing ? "מעבד תשלום..." : "שלם עכשיו"}
        </span>
      </button>
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
              colorPrimary: "#e63946",
              fontFamily: "Assistant, sans-serif",
              borderRadius: "8px",
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
