"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  /**
   * The PaymentIntent client secret. NULL while it's still being created in the
   * background — the card form is mounted and fillable before this arrives
   * (Stripe "deferred intent" flow); it's only needed to confirm the payment.
   */
  clientSecret: string | null;
  /** Buyer total in ILS — drives the pay button and the wallet/Elements amount. */
  total: number;
  termsAccepted: boolean;
  onTermsChange: (v: boolean) => void;
  /** Countdown bar + ticket stub, built by the dialog */
  topSlot: React.ReactNode;
  /** Summary card + escrow note, built by the dialog */
  summarySlot: React.ReactNode;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  /** Set when creating the PaymentIntent failed (e.g. a ticket was taken). */
  intentError?: string | null;
  /** Retry creating the PaymentIntent. */
  onRetryIntent?: () => void;
}

type FormProps = Omit<CheckoutStepPaymentProps, "total"> & { amountAgorot: number };

const PaymentForm: React.FC<FormProps> = ({
  clientSecret,
  amountAgorot,
  termsAccepted,
  onTermsChange,
  topSlot,
  summarySlot,
  onSuccess,
  onError,
  intentError,
  onRetryIntent,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Undefined until ExpressCheckoutElement's onReady fires. Stays false when no
  // wallet (Apple/Google Pay) can be shown, so we don't leave an empty gap.
  const [walletAvailable, setWalletAvailable] = useState<boolean>(false);

  // Reconcile the deferred amount once the server returns the authoritative
  // total (ticket price + platform fee). The charge itself is always the
  // server PaymentIntent's amount — this only keeps the wallet sheet / pay
  // button in sync so Stripe's confirm-time amount check passes.
  useEffect(() => {
    if (elements && amountAgorot > 0) {
      elements.update({ amount: amountAgorot });
    }
  }, [elements, amountAgorot]);

  const confirm = async () => {
    // clientSecret is required to confirm in the deferred flow; the button/
    // wallet are gated on it, so this is a belt-and-suspenders guard.
    if (!stripe || !elements || !clientSecret) return null;
    return stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/stripe/payment-complete`,
      },
      redirect: "if_required",
    });
  };

  const handleExpressConfirm = async () => {
    const result = await confirm();
    if (!result) return;
    const { error: confirmError, paymentIntent } = result;

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
    if (!stripe || !elements || !termsAccepted || !clientSecret) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "שגיאה בטופס התשלום");
      setIsProcessing(false);
      return;
    }

    const result = await confirm();
    if (!result) {
      setIsProcessing(false);
      return;
    }
    const { error: confirmError, paymentIntent } = result;

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

        {intentError && (
          <div
            style={{
              border: "1px solid rgba(196,55,62,0.18)",
              background: "rgba(196,55,62,0.08)",
              borderRadius: 12,
              padding: "12px 14px",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 12, color: "#C4373E", marginBottom: onRetryIntent ? 10 : 0 }}>
              {intentError}
            </div>
            {onRetryIntent && (
              <button
                type="button"
                onClick={onRetryIntent}
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
            )}
          </div>
        )}

        {/*
          Wallets are one-tap payments — keep them behind the terms checkbox too.
          The element stays mounted so onReady can fire, but the container
          collapses to zero height until a wallet (Apple/Google Pay) is actually
          available, so users without one don't see an empty blank box.
        */}
        <div
          style={{
            opacity: termsAccepted && clientSecret ? 1 : 0.45,
            pointerEvents: termsAccepted && clientSecret ? "auto" : "none",
            marginBottom: walletAvailable ? 12 : 0,
            height: walletAvailable ? "auto" : 0,
            overflow: "hidden",
          }}
        >
          <ExpressCheckoutElement
            onConfirm={handleExpressConfirm}
            onReady={(e) => setWalletAvailable(!!e.availablePaymentMethods)}
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
        total={amountAgorot / 100}
        disabled={!stripe || !clientSecret || isProcessing || !termsAccepted}
        processing={isProcessing || (!clientSecret && !intentError)}
      />
    </form>
  );
};

const APPEARANCE = {
  theme: "stripe" as const,
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
};

const CheckoutStepPayment: React.FC<CheckoutStepPaymentProps> = ({
  clientSecret,
  total,
  ...formProps
}) => {
  const stripePromise = getStripe();
  const amountAgorot = Math.max(Math.round(total * 100), 1);

  // Mount Elements in deferred mode with the amount only — no clientSecret — so
  // the card form appears immediately, while the reservation + PaymentIntent are
  // created in the background. The amount here is captured once (Elements can't
  // change mode/currency after mount); later totals are reconciled via
  // elements.update() inside the form. The real charge is always the
  // server-created PaymentIntent's amount.
  const [initialAmount] = useState(amountAgorot);
  const options = useMemo(
    () => ({
      mode: "payment" as const,
      amount: initialAmount,
      currency: "ils",
      appearance: APPEARANCE,
      locale: "he" as const,
    }),
    [initialAmount],
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        {...formProps}
        clientSecret={clientSecret}
        amountAgorot={amountAgorot}
      />
    </Elements>
  );
};

export default CheckoutStepPayment;
