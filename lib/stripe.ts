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

// Platform fee percentage — read from env var, default 0%
// Can be overridden per-transaction or updated via Firestore config doc
export function getPlatformFeePercent(): number {
  const envFee = process.env.PLATFORM_FEE_PERCENT;
  if (envFee) {
    const parsed = parseFloat(envFee);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      return parsed;
    }
  }
  return 0;
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
