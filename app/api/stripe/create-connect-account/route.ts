import { NextResponse } from "next/server";

// Stripe Connect is not used. Sellers provide bank details directly.
export async function POST() {
  return NextResponse.json(
    { error: "Stripe Connect is not used. Use /api/seller/payment-details instead." },
    { status: 410 }
  );
}
