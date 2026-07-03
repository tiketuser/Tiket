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
import { PayFooter, TermsRow } from "../CheckoutDesign";

interface CheckoutStepPaymentProps {
  clientSecret: string;
  total: number;
  termsAccepted: boolean;
  onTermsChange: (v: boolean) => void;
  /** Countdown bar + ticket stub, built by the dialog */
  topSlot: React.ReactNode;
  /** Summary card + escrow note, built by the dialog */
  summarySlot: React.ReactNode;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

const PaymentForm: React.FC<Omit<CheckoutStepPaymentProps, "clientSecret">> = ({
  total,
  termsAccepted,
  onTermsChange,
  topSlot,
  summarySlot,
  onSuccess,
  onError,
}) => {
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
    if (!stripe || !elements || !termsAccepted) return;

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
      className="flex flex-col flex-1 min-h-0 w-full"
      dir="rtl"
    >
      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 18px" }}>
        {topSlot}

        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          אופן תשלום
        </div>

        {/* Wallets are one-tap payments — keep them behind the terms checkbox too */}
        <div
          style={{
            opacity: termsAccepted ? 1 : 0.45,
            pointerEvents: termsAccepted ? "auto" : "none",
            marginBottom: 12,
          }}
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
        </div>

        <PaymentElement
          options={{
            layout: {
              type: "accordion",
              radios: true,
              spacedAccordionItems: true,
            },
          }}
        />

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
              marginTop: 12,
            }}
          >
            {error}
          </p>
        )}

        {summarySlot}

        <TermsRow checked={termsAccepted} onChange={onTermsChange} />
      </div>

      <PayFooter
        total={total}
        disabled={!stripe || isProcessing || !termsAccepted}
        processing={isProcessing}
      />
    </form>
  );
};

const CheckoutStepPayment: React.FC<CheckoutStepPaymentProps> = ({
  clientSecret,
  ...formProps
}) => {
  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#B54653",
            colorBackground: "#FBF8F1",
            colorText: "#0A0A0A",
            colorTextSecondary: "#6E6A60",
            colorDanger: "#C4373E",
            fontFamily: "Heebo, Assistant, sans-serif",
            borderRadius: "10px",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": {
              border: "1px solid #CFC9B8",
              backgroundColor: "#F5F1E8",
            },
            ".Input:focus": {
              border: "1px solid #B54653",
              boxShadow: "0 0 0 1px #B54653",
            },
            ".AccordionItem": {
              border: "2px solid #E4DFD2",
              backgroundColor: "#FBF8F1",
              boxShadow: "none",
            },
            ".AccordionItem--selected": {
              border: "2px solid #B54653",
              backgroundColor: "rgba(181, 70, 83, 0.04)",
              color: "#0A0A0A",
            },
            ".Label": {
              color: "#6E6A60",
            },
          },
        },
        locale: "he",
      }}
    >
      <PaymentForm {...formProps} />
    </Elements>
  );
};

export default CheckoutStepPayment;
