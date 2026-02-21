import { NextResponse } from "next/server";

// Stripe Connect dashboard is not used. Sellers manage bank details in their profile.
export async function GET() {
  return NextResponse.json(
    { error: "Not available. Seller payment details are managed in the profile." },
    { status: 410 }
  );
}
