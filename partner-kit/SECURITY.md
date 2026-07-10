# Tiket Connect — security model & threat analysis

**Audience:** the partner's security / infrastructure team.
**Scope:** the Tiket Connect protocol (v1.1), the Agent (outbound mode), the
self-hosted endpoint (direct mode), and the Node embed kit.
**Version:** July 2026.

This document exists so your review takes an afternoon, not a quarter. It
states what runs where, what crosses the wire, what we can and cannot do to
your systems, and the limitations we know about — including the ones that are
not flattering.

---

## 1. What this integration is

TIKET is a secondary-market ticket marketplace. Two operations are defined:

1. **Verify** — a seller uploaded a ticket claiming it's yours; TIKET asks
   your deployment "is this real?" You answer with a verdict only.
2. **Transfer** (optional) — a verified ticket was resold; TIKET asks you to
   invalidate the seller's barcode and issue the ticket to the buyer.

Both run **inside your infrastructure**. TIKET never queries your database,
never receives your customer records, and never holds credentials to any of
your systems.

## 2. Deployment modes and attack surface

### Mode A — Agent (recommended): zero inbound exposure

```
YOUR NETWORK                                          TIKET CLOUD
┌──────────────────────────────────────┐             ┌───────────────────┐
│ ticket DB                            │             │                   │
│   ▲ (read-only user / internal API)  │  outbound   │  relay mailbox    │
│ tiket-agent ─────────────────────────┼──HTTPS─────►│  (signed          │
│  · verifies HMAC on every envelope   │   only      │   envelopes)      │
│  · compares locally                  │             │        ▲          │
│  · answers verdicts only             │             │  TIKET engine     │
└──────────────────────────────────────┘             └───────────────────┘
```

- The agent makes **outbound-only** HTTPS connections (long poll). You open
  **no inbound ports**, publish no URL, deploy no TLS certificate, change no
  firewall rules. There is nothing on your side for an internet attacker to
  probe.
- Works behind NAT and corporate proxies; egress allowlist: `tiket.co.il:443`.

### Mode B — self-hosted endpoint: standard webhook posture

You host `POST /tiket/verify` (+ optional `/transfer`, `GET /health`) on a
URL you choose. Same signed protocol; your standard internet-facing service
review applies. Reference implementation: the zero-dependency Node kit.

## 3. Layered security model

The design assumption is that **the transport and relay are untrusted** —
compromise of the relay mailbox, a CDN, or a network path must not allow
forged requests.

| # | Layer | Mechanism | Defeats |
| --- | --- | --- | --- |
| L1 | Request authenticity | HMAC-SHA256 over `timestamp.body` (Stripe-webhook construction), verified **inside your deployment** with a secret only you and TIKET hold; constant-time compare; ±300s replay window | Forged or replayed requests, even by an attacker controlling the relay or holding valid relay credentials |
| L2 | Key lifecycle | `X-Tiket-Key-Id` + multi-key support: overlap rotation (both keys valid during switch), revocation, no key ever readable again after issuance (TIKET stores usage, you store the secret) | Long-lived-secret compromise; rotation without downtime |
| L3 | Relay access (mode A) | Enrollment via single-use pairing token (24h TTL, stored hashed); agent receives a per-agent bearer key (stored hashed); instant admin revocation | Unauthorized agents attaching to your mailbox; stolen-token reuse |
| L4 | Transport | TLS 1.2+ to `tiket.co.il`; outbound-only in mode A | Passive interception; inbound attack surface |
| L5 | Blast radius on your systems | Agent reads via *your* internal endpoint or a **single SELECT with a read-only DB user** (SELECT-only guard at startup; read-only enforcement is one `GRANT` your DBA can verify). Writes happen only in *your* code, only if you opt into transfer. | "Vendor software touched our data" — it structurally cannot |
| L6 | Supply chain | Agent is a static Go binary; protocol/crypto/relay code is Go stdlib only, SQL drivers are the sole third-party code. Releases ship with `SHA256SUMS`. The Node kit is one dependency-free file. Full source is in this kit — audit it. | Tampered binaries; hidden dependency risk |

## 4. Data flows — exactly what crosses the wire

**Verify request (TIKET → you):** the *claimed* ticket details a seller
typed/uploaded — barcode, event, venue, date/time, seat. This is data the
seller already had. No TIKET user identity is included.

**Verify response (you → TIKET):** `match / mismatch / not_found`, matched
field *names*, confidence, ticket status, and optionally your internal ref +
face price. **No customer name, email, phone, or payment data — ever.** A
verify integration cannot leak your customer PII because the schema has no
fields for it.

**Transfer request (TIKET → you), only if you opt in:** the buyer's contact
details (name, email, phone) — the minimum needed to issue the ticket to its
new lawful holder, sent under the same signature. This is the *only* PII in
the protocol, it flows *toward* you, and it exists so the ticket ends up in
your system under the real attendee's name (which most partners actively
want).

**Enrollment/heartbeat metadata (mode A):** hostname, agent version,
platform, lookup mode. Nothing else.

## 5. Abuse analysis

- **Barcode probing ("oracle"):** TIKET's public verification API requires an
  authenticated user and is rate-limited per user; your deployment only
  accepts signed requests, so third parties cannot query you through TIKET or
  directly.
- **Double-transfer:** `transfer_ref` is deterministic per (payment, ticket).
  The kit/agent replays the original answer from memory; we require durable
  idempotency in your transfer implementation (one table) for restarts. The
  spec makes a repeated `transfer_ref` a MUST-not-transfer-again.
- **Malicious relay operator (mode A):** can delay or drop envelopes (denial
  of service, visible in TIKET's monitoring) but cannot forge (L1), replay
  (timestamp window), or read anything not in §4.
- **Stolen agent binary/credentials:** the agent key only grants access to
  *poll your own mailbox*; verdicts still require your lookup source, and
  request forgery still requires the HMAC secret. Revoke the agent in TIKET's
  panel; rotate the HMAC key from the same panel.

## 6. Known limitations (stated, not hidden)

1. **Responses are not signed in v1.1.** Answer integrity relies on TLS +
   relay authentication, not end-to-end cryptography. Response signing is the
   planned v1.2 addition; the envelope already carries the fields needed to
   adopt it additively.
2. **Transfer envelopes hold buyer contact details in the relay mailbox**
   until answered (mode A). They are encrypted at rest (Firestore), deleted
   by TTL, and readable only by TIKET's service credentials — but envelope
   encryption to the agent's key is a roadmap item, not shipped.
3. **The SELECT-only guard is syntactic.** The real control in SQL mode is
   the read-only database user — which is yours to create and audit.
4. **In-memory idempotency doesn't survive restarts** — hence the durable
   `transfer_ref` table requirement on your side.

## 7. Operational recommendations

- Run the agent as an unprivileged user / distroless container (provided).
- SQL mode: create a dedicated `tiket_readonly` login with `SELECT` on the one
  view/table needed — nothing else.
- HTTP mode: bind the lookup endpoint to localhost or a private interface.
- Verify `SHA256SUMS` on the binary you deploy; pin versions, update on
  release notes.
- Rotate the HMAC key on your normal credential schedule (TIKET's panel makes
  it a two-click overlap rotation).

## 8. Reference

- Protocol spec: [`openapi.yaml`](openapi.yaml) (v1.1)
- Deterministic test vectors both implementations must pass:
  [`spec/test-vectors.json`](spec/test-vectors.json)
- Signature: `hex(HMAC_SHA256(secret, timestamp + "." + raw_body))`,
  headers `X-Tiket-Timestamp`, `X-Tiket-Signature`, optional `X-Tiket-Key-Id`.

Questions, disclosures, or audit requests: **security@tiket.co.il**.
