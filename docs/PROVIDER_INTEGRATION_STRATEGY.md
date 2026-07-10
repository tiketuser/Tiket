# Provider Integration Strategy — connecting TIKET to ticketing companies

**Updated:** July 2026 · **Owner:** Aviv & Ofek · **Status:** Active strategy

This document is the plan for connecting TIKET to the primary ticketing companies
(Leaan, Eventim IL, Tomix, Tickchak, Ticketmaster, Tixwise…). It replaces
`REAL_API_INTEGRATION_GUIDE.md` (which assumed every provider has a public REST API —
they don't). It is grounded in an audit of the code that exists today.

---

## 1. Market reality (research summary, July 2026)

| Provider | Public API? | Realistic path |
| --- | --- | --- |
| **Leaan (לאן)** | ❌ None published. Closed platform (leaan.co.il / tickets.leaan.net). | Business deal → hand their tech team the **Tiket Connect kit** (`partner-kit/`). |
| **Eventim Israel** | ⚠️ `developer.eventim.com` exists but is partner-gated (contract first). | Apply to partner program; when credentials arrive, add as a **custom provider** in the admin panel — no code needed. |
| **Ticketmaster IL** | ⚠️ Real Partner API (Order Management, SafeTix barcodes) — contract-gated, aimed at distribution partners. | Long-term. Same as Eventim: custom provider config once credentials exist. |
| **Tomix (תומיקס)** | ❌ None published. | Tiket Connect kit. |
| **Tickchak (טיקצ'ק)** | ❌ None published. | Tiket Connect kit. |
| **Tixwise** | ❌ None published. | Tiket Connect kit. |

**The insight:** the international players have gated APIs we must *adapt to*;
the local players have *no* API program at all, so the only scalable move is to
hand them one — a spec + a drop-in adapter so small that a junior dev can deploy
it in under an hour. That is the **Tiket Connect** partner kit.

Two integration tracks, both feeding the same verification engine:

```
                         ┌──────────────────────────────┐
   Track A (locals)      │        TIKET server          │
 Leaan / Tomix / Tickchak│  lib/venueVerify.ts engine   │
 host our partner kit ───►  protocol: "tiket_connect"   │
 (HMAC, standard schema) │                              │
                         │  protocol: "custom"          │
   Track B (globals)     │  (URL + auth + body template │
 Eventim / Ticketmaster ─►   + response field mapping)  │
 we adapt to their API   └──────────────────────────────┘
```

---

## 2. What existed before this work (audit)

**Solid foundation, already live:**

- `lib/venueVerify.ts` — server-authoritative verification engine. Loads provider
  configs from Firestore `venue_api_providers`, secrets from `venue_api_secrets`
  (Admin-SDK-only), renders a `{{var}}` JSON body template, POSTs it, reads one
  dot-path boolean (`responseValidField`). Falls back to a demo matcher
  (Firestore `mock_tickets` + dev-only static JSON).
- `app/api/create-ticket/route.ts` — the **only** write path for tickets. Verifies
  the seller's ID token, enforces barcode uniqueness in a transaction, re-runs
  verification server-side, and maps the result to ticket status
  (`verified → available`, `needs_review → pending_approval`, `rejected → rejected`).
  Clients cannot declare their own verification result. This design is correct — keep it.
- `app/Admin/venue-providers/page.tsx` — admin CRUD for providers (generic form:
  URL, auth type, body template, valid-field, barcode-pattern routing, notes).
- `app/approve-tickets/page.tsx` — manual review queue showing confidence,
  matched/unmatched fields, and reason.

**Gaps found (and fixed as part of this work):**

1. **The admin "test connection" button was fake.** It sent `_testProviderId`, but the
   engine ignored that field — the "test" actually ran a full verification with dummy
   data against *every* enabled provider, and any HTTP status < 500 displayed as
   "connected". → Fixed: dedicated admin test endpoint that targets one provider and
   reports latency, HTTP status, parsed validity, and a sanitized response snippet.
2. **`/api/venue-verify` was completely unauthenticated** — anyone on the internet could
   replay barcodes to probe which tickets exist ("oracle" attack). → Fixed: requires a
   signed-in Firebase user + per-user rate limit.
3. **POST-with-JSON-template was the only request shape.** Many verification APIs are
   `GET /tickets/{barcode}`-style. → Fixed: per-provider HTTP method + the endpoint
   path itself is now a template.
4. **Response parsing was a single boolean.** No way to read a provider's confidence,
   matched fields, ticket reference, or original price. → Fixed: optional dot-path
   mappings for all of these; original price now persists onto the ticket document
   (useful in admin review to spot price gouging).
5. **Over-eager hard rejection.** Any explicit "invalid" from any provider became a
   hard rejection — but "Leaan doesn't know this barcode" is *not* evidence of fraud
   when the ticket is actually an Eventim ticket. → Fixed: a provider's negative answer
   is a hard rejection only when the provider was *targeted* (its barcode pattern
   matched) or when a Tiket Connect partner answers `mismatch` (barcode found, details
   differ). A scatter-shot `not_found` just falls through to manual review.
6. **No retries, fixed timeout, no observability.** → Fixed: one retry on 5xx/429/network
   errors, per-provider timeout, per-provider stats (calls, verified, rejected, errors,
   avg latency, last error) stored on the provider doc and shown in the admin panel,
   plus a `verification_logs` collection for the audit trail.
7. **No re-verification.** A ticket stuck in `needs_review` (e.g. uploaded before a
   provider was configured) could only be approved by eyeballing it. → Fixed:
   "re-verify" action in the admin ticket queue re-runs the engine and upgrades the
   ticket automatically if the provider now vouches for it.
8. **Admin had to hand-type provider configs.** → Fixed: one-click presets for the known
   Israeli providers and for the Tiket Connect standard.

---

## 3. Track A — Tiket Connect (the plug-and-play kit)

**Problem it solves:** a local provider has the data (their own tickets DB) but no API,
no appetite to design one, and a legal team worried about customer data.

**Three integration paths, one protocol (v2, July 2026):**

| Path | Partner effort | Inbound exposure |
| --- | --- | --- |
| **A. Agent** (flagship) | one static Go binary/container + 0–20 lines (internal lookup endpoint in any language, or zero-code: one read-only SQL query) | **none** — outbound-only long-poll to TIKET's relay |
| **B. Self-hosted endpoint** | ~50 lines from `openapi.yaml`, any stack | one public HTTPS URL |
| **C. Node embed kit** | one `lookupTicket` function | existing app's URL |

The agent (SAP Cloud Connector / cloudflared pattern) is what makes the
security pitch land: the partner opens no ports, publishes no URL, deploys no
TLS cert — and the relay in the middle is *untrusted by design* because every
envelope stays HMAC-signed end-to-end and is verified inside the agent.
TIKET-side relay: `lib/agentRelay.ts` + `/api/agent/{enroll,poll,respond}`
(Firestore-mailbox long-poll through the existing Cloud Run service, behind an
`AgentTransport` interface so a dedicated WebSocket relay can replace it at
scale). Enrollment: admin generates a one-time pairing token → agent exchanges
it for hashed long-lived credentials; agents are revocable from the panel.
Signing keys support ids + zero-downtime rotation (`X-Tiket-Key-Id`,
active/retiring/revoked lifecycle in `venue_api_secrets.keys[]`).

**Design principles:**

- **One function to implement (or none).** The partner writes a single
  `lookupTicket(barcode)` — as code or as one read-only SELECT. Everything
  else — transport, auth, validation, field comparison, scoring, response
  shaping — is the kit's job.
- **Privacy-preserving by construction.** TIKET sends the *claimed* ticket details;
  the kit compares them against the partner's record *inside the partner's
  infrastructure* and returns only `match / mismatch / not_found`, matched-field
  names, and (optionally) a reference + original price. **No customer PII ever
  leaves the partner's system.** This is the argument that gets legal to yes.
- **Bank-grade, boring auth.** HMAC-SHA256 request signing with a shared secret and
  a timestamp (the Stripe-webhooks model every backend dev already knows): headers
  `X-Tiket-Timestamp` + `X-Tiket-Signature = hex(hmac_sha256(secret, timestamp + "." + rawBody))`,
  5-minute replay window, timing-safe comparison. No OAuth dance, no key rotation
  ceremony to start, no inbound credentials stored on the partner side.
- **Zero dependencies.** The Node adapter is a single file using only the standard
  library. It runs standalone (`node server.js`) or mounts into an existing
  Express/Fastify/Nest app as middleware. A self-test script verifies the deployment
  without involving TIKET at all.
- **Versioned spec.** `openapi.yaml` pins `api_version: "1"`; additive evolution only.

**Wire format (v1):**

```
POST {partner-base-url}/tiket/verify
X-Tiket-Timestamp: 1783776000
X-Tiket-Signature: 3f1a…

{ "api_version": "1", "request_id": "uuid",
  "ticket": { "barcode": "…", "event_name": "…", "artist": "…", "venue": "…",
              "date": "2026-08-15", "time": "21:00",
              "section": "", "row": "", "seat": "", "is_standing": false } }

→ 200
{ "api_version": "1", "request_id": "uuid",
  "result": "match" | "mismatch" | "not_found",
  "confidence": 0-100,
  "matched_fields": ["barcode","artist","date","venue"],
  "unmatched_fields": [],
  "ticket_ref": "LN-88231",          // optional, partner's own id
  "ticket_status": "active",         // active|used|cancelled|refunded|transferred
  "original_price": 350, "currency": "ILS" }   // optional
```

`GET {base}/tiket/health` → `{ ok: true, kit_version, api_version, transfer_supported }`
(unauthenticated, used by the admin "test connection" button).

**Ownership transfer (protocol v1, kit ≥ 1.1):** when a ticket sells, TIKET
calls `POST {base}/tiket/transfer` (same HMAC auth) with the buyer's contact
details and an idempotency key (`transfer_ref`, deterministic per
payment+ticket). The partner invalidates the seller's barcode and issues the
ticket to the buyer — turning "we detect fraud" into "the seller's kept PDF
copy physically stops working". Partners implement one more function
(`transferTicket`); without it the endpoint answers `not_supported` and TIKET
falls back to manual handover. On our side both sale-completion paths (Stripe
webhook + confirm-payment) trigger `lib/venueTransfer.ts`; outcomes persist on
the ticket (`ownershipTransfer` — including any re-issued barcode) and in
`transfer_logs`, and failures are retryable via the admin `transfer` action.

**On the TIKET side** the engine speaks this protocol natively
(`protocol: "tiket_connect"`): the admin picks the "Tiket Connect" preset, pastes the
partner's base URL and the shared secret — done. No templates, no field mapping.

**Deliverables** (in `partner-kit/`): `agent/` (Go agent: binary/Docker,
http + zero-code SQL lookup, selftest), `examples/lookup-endpoint/` (the
partner's ~20 lines in Node/PHP/Python/.NET/Java), `openapi.yaml` (v1.1),
`spec/test-vectors.json` (deterministic vectors both implementations must
pass — the consistency contract), `node/tiket-connect.js` (+`.d.ts`,
selftest), `SECURITY.md` (threat model for the partner's security team), and
`INTEGRATION_GUIDE.md` v2 (path chooser, Hebrew TL;DR).

**The pitch to a partner (why they say yes):**

1. Fights the fraud that damages *their* brand (fake screenshots of their tickets).
2. Zero data exposure — match results only; their customer data stays home.
3. Near-zero engineering: one file + one SQL query; under a day including review.
4. Visibility: they learn which of their tickets circulate on the secondary market.
5. Optional future upsell: verified resale becomes an official-partner feature.

---

## 4. Track B — adapting to gated APIs (Eventim, Ticketmaster)

1. **Business first:** apply to the partner programs (Eventim developer portal;
   Ticketmaster distribution-partner track). Expect contracts and sandbox keys.
2. **No code per provider.** The admin panel's *custom* protocol covers auth
   (bearer / custom header / query / HMAC), HTTP method, endpoint template
   (`/tickets/{{barcode}}/status`), JSON body template, and response dot-path
   mapping (valid flag + value, confidence, matched fields, ticket ref, original
   price). When keys arrive, configuration is an admin-panel task, not a deploy.
3. **Barcode-pattern routing** sends each uploaded ticket only to the provider(s)
   whose barcode format matches, with priority ordering for tie-breaks.

---

## 5. Verification pipeline (after this work)

```
Seller uploads ticket (web OCR flow or mobile quick-sell)
        ↓
POST /api/create-ticket   (server-authoritative, auth required)
        ↓
lib/venueVerify.verifyTicket()
  1. Load enabled providers (60s in-memory cache) sorted by priority
  2. Barcode-pattern routing → targeted providers first
  3. Per provider: build request (custom template | tiket_connect envelope),
     sign (bearer/header/query/HMAC), send with timeout+retry,
     parse (custom mapping | standard schema), log + update stats
  4. verified → stop. Targeted "mismatch"/invalid → hard reject.
     Un-targeted not_found → keep trying → demo fallback (if enabled) → needs_review
        ↓
status: available | pending_approval | rejected  (+ confidence, fields, reason,
                                                  original price when known)
        ↓
Admin queue (/approve-tickets): review, link event, re-verify, approve/reject
        ↓  (buyer pays — Stripe webhook / confirm-payment mark it sold)
lib/venueTransfer.transferTicketsAfterSale()
  → POST /tiket/transfer to the issuing provider (deterministic transfer_ref)
  → old barcode invalidated, new barcode / delivery recorded on the ticket
  → failures retryable via admin "transfer" ticket action
```

---

## 6. Rollout plan

| Phase | What | Success signal |
| --- | --- | --- |
| **1. Now** | Engine + admin improvements live; kit published; guide ready to send. | Demo flow: kit running locally as "fake Leaan" → upload → auto-verified. |
| **2. First partner (Q3 2026)** | Sign one mid-size local (Tomix/Tickchak-tier — faster legal than Leaan). Deploy kit with them in sandbox → production. | ≥1 real provider enabled; auto-verification rate on their inventory >80%. |
| **3. Leaan** | Use partner #1 as the reference case. Leaan is ~40% of the market — this is the whale. | Leaan tickets auto-verify. |
| **4. Globals** | Eventim/Ticketmaster partner contracts; configure as custom providers. | All four majors verifying. |
| **5. Harden** | Move secrets to GCP Secret Manager; key rotation schedule; distributed rate limiting (Redis/Firestore counter); alerting on provider error spikes. | — |

**KPIs to watch (now visible in the admin panel):** auto-verification rate,
needs-review rate, provider error rate, avg verification latency, rejections.

---

## 7. Security model (summary)

- Verification is **server-side only**; clients never declare their own result.
- `/api/venue-verify` requires auth + rate limit (no anonymous barcode oracle).
- Provider secrets live in `venue_api_secrets`, readable only by the Admin SDK;
  the admin UI never echoes a stored key back. Keys carry ids and rotate with
  an active→retiring→revoked overlap (`/api/admin/venue-providers/keys`).
- Tiket Connect: HMAC-signed requests (+`X-Tiket-Key-Id`), replay-window,
  timing-safe compares, privacy-preserving responses — verified **inside** the
  partner deployment, so the relay/transport is untrusted by design.
- Agent relay: pairing tokens and agent keys stored as SHA-256 hashes,
  single-use enrollment, instant revocation, per-agent heartbeat (online =
  polled within 90s; verification fast-fails to the normal error path when the
  agent is offline).
- `verification_logs` + `transfer_logs` + `agent_requests` give an audit trail
  per attempt (no secrets logged; barcodes truncated).
- Full partner-facing threat model incl. stated limitations:
  `partner-kit/SECURITY.md`.

## 8. Related files

- Engine: `lib/venueVerify.ts` · HTTP wrapper: `app/api/venue-verify/route.ts`
- Agent relay: `lib/agentRelay.ts`, `lib/agentAuth.ts`,
  `app/api/agent/{enroll,poll,respond}/route.ts`
- Ownership transfer: `lib/venueTransfer.ts`
- Key lifecycle: `lib/providerKeys.ts`, `app/api/admin/venue-providers/keys/route.ts`
- Ticket creation: `app/api/create-ticket/route.ts`
- Admin providers UI/API: `app/Admin/venue-providers/page.tsx`,
  `app/api/admin/venue-providers/route.ts` (+ `/test`, `/enroll-token`, `/agents`)
- Review queue: `app/approve-tickets/page.tsx`, `app/api/admin/ticket-action/route.ts`
- Partner kit: `partner-kit/` (Go agent, spec + shared test vectors, Node
  adapter, per-language lookup examples, SECURITY.md, integration guide v2)
- Firestore: rules blocks for `agent_enroll_tokens` / `venue_agents` /
  `agent_requests`; composite index on `agent_requests(providerId,status,createdAt)`.
  **Ops (one-time):** enable Firestore TTL on `agent_requests.expiresAt` and
  `agent_enroll_tokens.expiresAt`.
