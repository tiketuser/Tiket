# Stripe Production Go-Live Guide — TIKET

## Audit Summary (completed 2026-03-06)

### Fixed
| Issue | File | Fix Applied |
|---|---|---|
| `automatic_payment_methods` missing | `create-payment-intent/route.ts` | Added `{ enabled: true }` |
| `setup_future_usage: "off_session"` breaking Apple/Google Pay | `create-payment-intent/route.ts` | Changed to `"on_session"` |
| Webhook fee fallback was `0` instead of platform default | `webhook/route.ts` | Changed to `getPlatformFeePercent()` |
| Unauthenticated guests could release any reserved ticket | `release-reservation/route.ts` | Now requires `guestEmail` in body, verified against `reservedBy` |
| Dead raw card input forms (PCI liability) | `CheckoutUserDialog/`, `CheckoutGuestDialog/` | Deleted |

---

## Production Go-Live Checklist

### Step 1 — Complete Stripe Account Activation

1. Log in to dashboard.stripe.com
2. Switch to **Live mode** (toggle top-left)
3. Go to **Settings → Business details** and complete:
   - Business address in Israel
   - Business type and registration number
   - Bank account for payouts (Israeli bank account in ILS)
4. Complete **identity verification** for all directors/owners
5. Wait for Stripe approval (usually 1-3 business days for Israel)

---

### Step 2 — Swap Environment Variables

Replace test keys with live keys in:

**Google Cloud Run (production):**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   <- set after Step 3
PLATFORM_FEE_PERCENT=5            <- confirm your fee %
```

**Local `.env.local` (for local production testing only):**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> Never commit `.env.local` to git.

---

### Step 3 — Register the Webhook in Live Mode

1. Stripe Dashboard -> **Developers -> Webhooks -> Add endpoint**
2. URL: `https://tiket.co.il/api/stripe/webhook`
3. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Click **Add endpoint**
5. Copy the **Signing secret** (`whsec_...`) -> set as `STRIPE_WEBHOOK_SECRET` in Cloud Run

---

### Step 4 — Enable Apple Pay Domain Verification

1. Stripe Dashboard -> **Settings -> Payment methods -> Apple Pay -> Add domain**
2. Enter `tiket.co.il`
3. Stripe will give you a file to host at:
   ```
   https://tiket.co.il/.well-known/apple-developer-merchantid-domain-association
   ```
4. Download the file from Stripe and place it at:
   ```
   public/.well-known/apple-developer-merchantid-domain-association
   ```
   (no file extension)
5. Deploy, then click **Verify** in the Stripe dashboard

> Google Pay requires no extra setup — enabled automatically via `automatic_payment_methods`.

---

### Step 5 — Smoke Test in Live Mode

Use a **real card** (your own) to verify end-to-end:

- [ ] Payment completes successfully
- [ ] Webhook fires: check Stripe Dashboard -> Developers -> Webhooks -> recent deliveries
- [ ] Firestore `transactions` document is created with correct amounts
- [ ] Ticket `status` changes from `reserved` -> `sold`
- [ ] Reservation timer and auto-release work on dialog close
- [ ] Guest checkout flow completes (email + phone)
- [ ] Apple Pay appears on Safari/iOS
- [ ] Google Pay appears on Chrome/Android

---

### Step 6 — Stripe Radar (Fraud Rules)

Stripe Dashboard -> **Radar -> Rules**:

Recommended rules for Israel:
- Block when `risk_score >= 75`
- Review when `risk_score >= 50`
- Block if `card_country != IL` (optional — if Israel-only cards desired)

For 3DS (Israeli banks often trigger it automatically):
- Stripe handles 3DS challenge inside the Payment Element iframe automatically
- To force 3DS above a threshold: Radar -> Rules -> "Request 3D Secure for card payments over 500 ILS"

---

### Step 7 — Seller Payout Process

Your current model: **buyer pays Stripe -> you hold -> manual bank transfer to seller after `payoutEligibleAt`**

The `transactions` Firestore collection drives this:

| Field | Description |
|---|---|
| `sellerPayoutStatus` | `"pending"` until you pay, then `"paid"` |
| `payoutEligibleAt` | 7 days after event date |
| `sellerPayout` | Amount in ILS to send the seller |
| `sellerId` | Maps to `users/{uid}` -> `paymentDetails` |

**Payout workflow:**
1. Query `transactions` where `sellerPayoutStatus == "pending"` and `payoutEligibleAt <= now()`
2. Read `users/{sellerId}.paymentDetails` for bank account details
3. Initiate bank transfer (Israeli bank / Bit / PayBox)
4. Update `sellerPayoutStatus = "paid"` and `paidAt = now()`

**Future:** Stripe Connect (Destination Charges or Transfer model) can automate this entirely — recommended once volume justifies the setup.

---

### Step 8 — Go-Live Monitoring

Set up these before launch:

**Stripe Dashboard -> Developers -> Webhooks:**
- Enable email alerts on webhook failures

**Stripe Dashboard -> Radar:**
- Enable dispute/chargeback alerts

**Google Cloud Run -> Logging:**
- Alert on log entries containing `Payment intent creation error`
- Alert on log entries containing `Webhook handler error`

---

## Architecture Reference

```
Buyer (browser)
  |
  +- POST /api/stripe/create-payment-intent
  |     Validates tickets, reserves them, creates Stripe PaymentIntent
  |     Returns clientSecret
  |
  +- Stripe.js (Payment Element) — card data never touches your server
  |     stripe.confirmPayment() -> Stripe handles 3DS if needed
  |
  +- POST /api/stripe/confirm-payment  (optimistic, fast path)
  |     Marks ticket sold, creates transaction record
  |
  +- POST /api/stripe/webhook  (reliable fallback, server-to-server)
        payment_intent.succeeded -> same as confirm-payment if not already done
        payment_intent.payment_failed -> releases reservation
```

**PCI Compliance scope:** SAQ A — Stripe.js handles all card data in an iframe.
Your server never sees raw card numbers, CVVs, or expiry dates.
