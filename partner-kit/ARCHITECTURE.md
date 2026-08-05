# Tiket Connect — Architecture & Flows

How the whole system fits together, with a diagram for every path and every
flow. This is the "see it at a glance" companion to
[`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) (the how-to) and
[`SECURITY.md`](SECURITY.md) (the threat model).

**What Tiket Connect is:** a signed request/response protocol that lets TIKET
ask the company that *issued* a ticket one question — *"is this barcode real,
still valid, and does it match these details?"* — and, on resale, hand the
ticket to its new owner. The comparison runs **inside the issuer's system**;
only a verdict (`match` / `mismatch` / `not_found`) crosses the wire. No
customer data ever leaves the issuer.

---

## 1. The big picture

```mermaid
flowchart LR
    subgraph TIKET["☁️ TIKET (Cloud Run + Firestore)"]
        SELLER["Seller lists a ticket"] --> ENGINE["venueVerify engine<br/>signs every request (HMAC)"]
        ENGINE --> MODE{"connectionMode?"}
        MODE -->|agent| RELAY[("Relay mailbox<br/>agent_requests")]
    end

    subgraph PARTNER["🏢 Ticket issuer (Leaan / Tomix / Eventim …)"]
        AGENT["tiket-agent"] --> LOOKUP["Lookup: HTTP endpoint<br/>or read-only SQL"]
        ENDPOINT["Self-hosted endpoint"] --> LOOKUP
        LOOKUP --> DB[("Ticket database")]
    end

    MODE -->|direct| ENDPOINT
    AGENT -. "outbound HTTPS long-poll (443)" .-> RELAY
    RELAY -. "verdict only (no PII)" .-> ENGINE
    ENDPOINT -. "verdict only (no PII)" .-> ENGINE
```

Two transports, one protocol:

- **Agent (relay):** the issuer opens **nothing** inbound. A small program
  (`tiket-agent`) dials *out* to TIKET and picks work off a mailbox.
- **Direct:** the issuer hosts a public HTTPS endpoint TIKET calls straight.

Either way every request is HMAC-signed and re-verified inside the issuer's
deployment, so the transport in between is untrusted by design.

---

## 2. Which path? (decision tree)

```mermaid
flowchart TD
    Start(["Ticket issuer integrating with TIKET"]) --> Q1{"Can you expose a<br/>public HTTPS URL?"}
    Q1 -->|"No — locked-down network"| A["Path A — Agent<br/>outbound-only, zero inbound"]
    Q1 -->|Yes| Q2{"Already run a<br/>Node.js service?"}
    Q2 -->|Yes| C["Path C — Node embed<br/>drop in one function"]
    Q2 -->|"No / other stack"| B["Path B — Self-hosted endpoint<br/>implement openapi.yaml"]
    A --> Q3{"Prefer ~20 lines<br/>or zero code?"}
    Q3 -->|"Zero code"| A1["SQL mode:<br/>one read-only SELECT"]
    Q3 -->|"~20 lines"| A2["HTTP mode:<br/>internal lookup endpoint"]
```

| Path | You deploy | You write | Inbound exposure |
| --- | --- | --- | --- |
| **A. Agent** (recommended) | one static binary / container | 0–20 lines | **none** |
| **B. Self-hosted endpoint** | a small HTTPS service | ~50 lines from the spec | one public URL |
| **C. Node embed** | nothing new | one function | your existing app's URL |

---

## 3. Path A — the Agent

### Topology (nothing is reachable from the internet)

```mermaid
flowchart LR
    subgraph P["🏢 Partner network — no inbound ports, no public URL, no TLS cert"]
        DB[("Ticket database")]
        LK["Lookup<br/>HTTP endpoint OR SQL SELECT"]
        AGENT["tiket-agent<br/>(static Go binary)"]
        DB --- LK
        LK --- AGENT
    end
    subgraph T["☁️ TIKET"]
        RELAY[("Relay mailbox")]
        ENGINE["venueVerify engine"]
        ENGINE --- RELAY
    end
    AGENT ==>|"1 · outbound long-poll"| RELAY
    RELAY -.->|"2 · a signed request is waiting"| AGENT
    AGENT ==>|"3 · signed verdict"| RELAY
```

### Verify — full round trip

```mermaid
sequenceDiagram
    autonumber
    participant S as Seller
    participant T as TIKET engine
    participant R as Relay mailbox
    participant A as tiket-agent
    participant D as Issuer DB
    S->>T: Upload ticket (OCR → barcode + details)
    T->>T: Build envelope · sign HMAC · set X-Tiket-Key-Id
    T->>R: Drop signed request (status: pending)
    A-->>R: Outbound long-poll
    R-->>A: Deliver the request
    A->>A: Verify HMAC locally (±300s, constant-time)
    A->>D: Look up barcode (READ-ONLY)
    D-->>A: Ticket record (or none)
    A->>A: Compare claimed vs. real, locally
    A->>R: Post verdict (match / mismatch / not_found)
    R-->>T: Verdict (no customer PII)
    T->>S: Auto-approve · needs review · reject
```

### Enrollment (one-time pairing)

```mermaid
sequenceDiagram
    autonumber
    participant Ad as TIKET admin
    participant T as TIKET
    participant A as tiket-agent
    Ad->>T: "צור טוקן צימוד" — create pairing token
    T-->>Ad: One-time token (24h, stored only as SHA-256 hash)
    Ad->>A: Hand the token to the partner (secure channel)
    A->>T: tiket-agent enroll --token <token>
    T->>T: Validate + consume token (single-use)
    T-->>A: Agent identity + key (server keeps only the hash)
    A->>A: Save tiket-agent-credentials.json
    A->>T: tiket-agent run → long-poll + heartbeat
    Note over T,A: Panel shows "מחובר" while polled within 90s
```

---

## 4. Paths B & C — direct endpoint

Same protocol, TIKET just calls the issuer's URL instead of a mailbox.

```mermaid
sequenceDiagram
    autonumber
    participant T as TIKET engine
    participant P as Partner endpoint (/tiket/verify)
    participant D as Issuer DB
    T->>T: Build envelope · sign HMAC
    T->>P: POST signed request over public HTTPS
    P->>P: Verify HMAC over raw bytes (before JSON parse)
    P->>D: Look up barcode (read-only)
    D-->>P: Record (or none)
    P->>P: Compare locally
    P-->>T: 200 verdict (match / mismatch / not_found)
```

- **Path C (Node embed):** copy `node/tiket-connect.js`, implement one
  `lookupTicket(barcode)` function — the kit handles signing, matching,
  normalization, rotation, transfer. Mount as middleware or `listen()`.
- **Path B (any stack):** implement [`openapi.yaml`](openapi.yaml); validate
  against [`spec/test-vectors.json`](spec/test-vectors.json).

---

## 5. The verification decision (identical on every path)

```mermaid
flowchart TD
    In["Barcode + claimed details"] --> Look{"Barcode exists<br/>in your system?"}
    Look -->|No| NF["not_found<br/>(maybe another issuer's ticket)"]
    Look -->|Yes| St{"Ticket still active?"}
    St -->|"cancelled / refunded / used / transferred"| MMS["mismatch — resale blocked"]
    St -->|active| Cmp{"Barcode + event + date + venue<br/>all agree?"}
    Cmp -->|No| MMF["mismatch<br/>+ names of fields that differ"]
    Cmp -->|Yes| M["match ✓ + confidence"]
```

- Only **field names** ever come back on a mismatch — never the correct
  values. If a seller claims seat 12 and the truth is 14, TIKET learns only
  that `seat` didn't match.
- Missing optional fields are excluded from scoring, never held against the
  seller. Date formats, "07" vs "7", partial venue names, whitespace — all
  normalized by the kit/agent, so the issuer returns records **as they are**.

---

## 6. Ownership transfer (optional, closes the "kept PDF" hole)

Verification catches fakes at listing time. Transfer makes a *real but resold*
ticket's original copy worthless: the old barcode is voided and a fresh one is
issued to the buyer.

```mermaid
sequenceDiagram
    autonumber
    participant B as Buyer
    participant T as TIKET
    participant P as Partner (agent or endpoint)
    participant D as Issuer system
    B->>T: Completes purchase (Stripe escrow)
    T->>T: Build transfer envelope · deterministic transfer_ref
    T->>P: Signed transfer request + buyer's holder details
    P->>P: Idempotency check on transfer_ref
    P->>D: Void old barcode · reissue to the buyer
    D-->>P: new_barcode + barcode_format (qr / code128 / …)
    P-->>T: {ok, new_barcode, barcode_format, delivery}
    T->>B: Render the fresh barcode — old PDF now fails at the gate
```

- `transfer_ref` is deterministic, so retries never transfer twice; **durable**
  idempotency (one small table keyed on `transfer_ref`) is the issuer's job.
- The buyer's contact details are the one thing that flows *toward* the issuer
  — the minimum needed to issue the ticket to its new lawful holder.
- Skipping transfer is fine: the endpoint answers `not_supported` and TIKET
  falls back to manual handover; verification keeps working.

---

## 7. Security — the signed envelope

Every request carries a Stripe-webhook-style signature:

```
X-Tiket-Timestamp: 1700000000
X-Tiket-Signature: hex( HMAC_SHA256( secret, timestamp + "." + rawBody ) )
X-Tiket-Version:   1
X-Tiket-Key-Id:    k_ab12cd34     ← names the signing key (for rotation)
```

The receiver (1) rejects if the timestamp is >300s off, (2) recompiles the
signature over the **raw bytes** and compares constant-time, (3) only then
parses the JSON. A leaked-but-old message is useless; a tampered body breaks
the signature.

### Key rotation — zero downtime

`activeKeyId` names the key TIKET signs with now; the issuer may hold several
secrets and accept any non-revoked one. Each key moves through:

```mermaid
stateDiagram-v2
    [*] --> active: key generated (becomes the signer)
    active --> retiring: a newer key is generated
    retiring --> active: promote back (rare)
    retiring --> revoked: revoke after the partner drops it
    active --> revoked: emergency revoke
    revoked --> [*]
```

Rotation dance: generate new key (old → `retiring`, still verifies) → partner
adds the new secret alongside the old → confirm everything's green → revoke the
old. No maintenance window.

---

## 8. Where each piece lives (code map)

| Concern | Files |
| --- | --- |
| Verification engine + signing | `lib/venueVerify.ts` · `app/api/venue-verify/route.ts` |
| Relay (mailbox + agent API) | `lib/agentRelay.ts` · `lib/agentAuth.ts` · `app/api/agent/{enroll,poll,respond}/route.ts` |
| Ownership transfer | `lib/venueTransfer.ts` |
| Key lifecycle | `lib/providerKeys.ts` · `app/api/admin/venue-providers/keys/route.ts` |
| Admin UI (providers, keys, agents, pairing) | `app/Admin/venue-providers/page.tsx` |
| The agent | `partner-kit/agent/` (Go) |
| Node embed kit | `partner-kit/node/tiket-connect.js` |
| Shared protocol vectors | `partner-kit/spec/test-vectors.json` |
| Buyer-facing re-issued barcode | `app/components/TicketBarcode/TicketBarcode.tsx` |

See also: [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) ·
[`agent/README.md`](agent/README.md) · [`SECURITY.md`](SECURITY.md) ·
[`../docs/PROVIDER_INTEGRATION_STRATEGY.md`](../docs/PROVIDER_INTEGRATION_STRATEGY.md).
