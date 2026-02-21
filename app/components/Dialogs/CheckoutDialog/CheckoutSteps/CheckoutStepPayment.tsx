"use client";

import React, { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../../../../../lib/stripe-client";

interface CheckoutStepPaymentProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

const PaymentForm: React.FC<{
  onSuccess: () => void;
  onError: (message: string) => void;
}> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onSuccess();
    } else {
      setError("התשלום לא הושלם. נסה שוב.");
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:gap-6 w-full"
      dir="ltr"
    >
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <p className="text-red-500 text-sm text-center" dir="rtl">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-[48px] sm:h-[56px] bg-primary text-white rounded-lg font-bold text-text-regular sm:text-heading-5-desktop hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        dir="rtl"
      >
        {isProcessing ? "מעבד תשלום..." : "שלם עכשיו"}
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
