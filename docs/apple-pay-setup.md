# Apple Pay / Google Pay setup (Stripe ExpressCheckoutElement)

The checkout wallet row (Apple Pay in Safari, Google Pay in Chrome) is rendered
by Stripe's `ExpressCheckoutElement` in
`app/components/Dialogs/CheckoutDialog/CheckoutSteps/CheckoutStepPayment.tsx`.
It is already wired with `applePay: "always"`, `googlePay: "always"`. The
button will only appear after the domain is verified with Apple **and** the
visitor has a real card/wallet configured on the device. Until then the wallet
container collapses to zero height (no empty gap) — this is expected.

## One-time owner step: register the domain with Stripe

Apple Pay on the web requires Apple to verify that Stripe is authorized to
process payments on our domain. Stripe automates this — you just host the file
it gives you.

1. In the **Stripe Dashboard**, go to
   **Settings > Payments > Payment method domains** (a.k.a. **Apple Pay > Add
   domain**).
2. Add the production domain `tiket.co.il`, and also add the **staging Cloud Run
   domain** (the `tiket-app-staging-*.run.app` URL) so wallets work in staging.
3. Stripe shows/downloads the **domain-association file**. Replace
   `public/.well-known/apple-developer-merchantid-domain-association` with its
   **exact contents** — no file extension, exact bytes, no added newline or
   BOM. (Overwrite the placeholder line currently in that file.)
4. Deploy. Next.js copies `public/` into the static export `out/`, and the web
   server serves it, so it resolves at
   `https://tiket.co.il/.well-known/apple-developer-merchantid-domain-association`
   on both web and inside the app bundle.
5. Back in Stripe, click **Verify** on the domain. Once verified, no code
   change is needed — `ExpressCheckoutElement` starts showing Apple Pay in
   Safari and Google Pay in Chrome automatically for devices that have a
   wallet set up.

## Native iOS (Capacitor) caveat

Apple Pay via the web (`ExpressCheckoutElement`) works in Safari. Inside the
Capacitor `WKWebView` it depends on the domain-association file being served
from the app's origin. Since the app loads the bundled `out/` snapshot (which
includes `public/.well-known/...`) plus hits the live API, the association file
is bundled with the app too, so verification should carry over.

If Apple Pay still does **not** appear inside the native app after the domain is
verified on the web, the fallback is to add a **native Capacitor Stripe plugin**
(`@capacitor-community/stripe`) and present the native Apple Pay sheet. That is a
larger change and is **not** implemented here — treat it as a future step only if
the web wallet path proves insufficient in the WKWebView.
