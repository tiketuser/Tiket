import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Keep backward-compatible export that lazily resolves
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

// Platform fee percentage — read from env var, default 5%
// Set PLATFORM_FEE_PERCENT in Cloud Run environment variables to override
export function getPlatformFeePercent(): number {
  const envFee = process.env.PLATFORM_FEE_PERCENT;
  if (envFee) {
    const parsed = parseFloat(envFee);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      return parsed;
    }
  }
  return 5;
}

// Calculate platform fee in agorot (ILS smallest unit) from a price in ILS
export function calculatePlatformFee(priceILS: number): number {
  const feePercent = getPlatformFeePercent();
  if (feePercent === 0) return 0;
  return Math.round(priceILS * 100 * (feePercent / 100));
}

// Convert ILS price to agorot for Stripe
export function ilsToAgorot(priceILS: number): number {
  return Math.round(priceILS * 100);
}

// Resolve the effective fee %: prefer the value captured at reservation time and
// passed through PaymentIntent metadata; fall back to the current env default
// when it's missing or unparseable. Shared by the webhook and confirm-payment
// routes so both settle a sale on the exact same fee.
export function resolvePlatformFeePercent(metadataFee?: string | null): number {
  const parsed = parseFloat(metadataFee ?? "");
  return Number.isNaN(parsed) ? getPlatformFeePercent() : parsed;
}

export type SaleAmounts = {
  ticketPriceILS: number;
  platformFeeILS: number;
  sellerPayoutILS: number;
  /** What the buyer paid: ticket price plus the platform fee on top. */
  totalILS: number;
};

// Single source of truth for splitting a ticket sale into fee / seller payout /
// buyer total. Duplicated across the webhook and confirm-payment routes before —
// money code that must never diverge between the two settlement paths.
export function computeSaleAmounts(
  ticketPriceILS: number,
  feePercent: number,
): SaleAmounts {
  const platformFeeILS = feePercent > 0 ? ticketPriceILS * (feePercent / 100) : 0;
  return {
    ticketPriceILS,
    platformFeeILS,
    sellerPayoutILS: ticketPriceILS - platformFeeILS,
    totalILS: ticketPriceILS + platformFeeILS,
  };
}
