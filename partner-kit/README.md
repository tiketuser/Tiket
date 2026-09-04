# Tiket Connect — plug-and-play verification kit for ticketing providers

This directory is the **deliverable TIKET hands to a ticketing company**
(Leaan, Tomix, Tickchak, Tixwise…) so their system can answer resale
verification requests with minimal work — down to **zero code and zero inbound
exposure**. No customer PII ever leaves the partner's system; every request is
HMAC-signed and verified inside the partner's deployment.

Three integration paths, one protocol:

| Path | Partner effort | Inbound exposure |
| --- | --- | --- |
| **A. Agent** (recommended) — [`agent/`](agent/) | run one binary/container + 0–20 lines (internal endpoint **or** one read-only SQL query) | **none** — outbound-only connection to TIKET |
| **B. Self-hosted endpoint** — [`openapi.yaml`](openapi.yaml) | ~50 lines in any stack | one public HTTPS URL |
| **C. Node embed** — [`node/`](node/) | one `lookupTicket` function in an existing Node app | the app's existing URL |

Optionally, one more function enables **ownership transfer**: when a ticket
sells on TIKET, the provider invalidates the seller's barcode and issues the
ticket to the buyer (with `barcode_format` so it renders correctly at the
gate). That's the difference between *detecting* fraud and making the seller's
kept PDF copy worthless.

## Contents

| Item | What it is |
| --- | --- |
| [`INTEGRATION_GUIDE.md`](INTEGRATION_GUIDE.md) | **Start here** — path chooser + full guide for the partner's engineering team (Hebrew TL;DR inside). |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | The whole system at a glance — flowcharts for every path and flow (verify, transfer, enrollment, rotation). |
| [`HOW_IT_WORKS_HE.md`](HOW_IT_WORKS_HE.md) | הסבר לא-טכני בעברית — how it all works, in plain Hebrew, for non-technical readers. |
| [`SECURITY.md`](SECURITY.md) | Threat model & security analysis, written for the partner's security team. |
| [`agent/`](agent/) | The Tiket Connect Agent — static Go binary, outbound-only, `http` or zero-code `sql` lookup. |
| [`examples/lookup-endpoint/`](examples/lookup-endpoint/) | The partner's ~20 lines, ready to copy: Node / PHP / Python / .NET / Java. |
| [`openapi.yaml`](openapi.yaml) | Protocol spec (v1.1) — for partners implementing in any stack. |
| [`spec/test-vectors.json`](spec/) | Deterministic protocol vectors — every implementation must pass the same file. |
| [`node/tiket-connect.js`](node/tiket-connect.js) | The embeddable Node adapter — single file, zero dependencies, Node ≥ 18. |
| [`node/selftest.js`](node/selftest.js) | 23-check self-test for the Node kit (auth, matching, rotation, transfer, spec vectors). |
| [`node/example-standalone.js`](node/example-standalone.js) / [`example-express.js`](node/example-express.js) | Node deployment examples. |

## The 30-second version (Agent path)

Partner side:

```bash
# 1. download + verify the agent (stable URL — see agent/README.md for macOS/Windows/arm64)
BASE=https://github.com/tiketuser/Tiket/releases/latest/download
curl -fsSLO $BASE/tiket-agent_linux_amd64.tar.gz && curl -fsSLO $BASE/SHA256SUMS
sha256sum -c SHA256SUMS --ignore-missing && tar xzf tiket-agent_linux_amd64.tar.gz

# 2. connect your data: implement examples/lookup-endpoint/<your-language>
#    (or configure one read-only SQL query — zero code)
# 3. enroll once + run
./tiket-agent enroll --token <pairing token from TIKET>
./tiket-agent run                 # logs "…polling relay… connected"
```

Full step-by-step: **[`agent/README.md` → Deploy in 5 minutes](agent/README.md#deploy-in-5-minutes)**.

TIKET side: the provider card in `/Admin/venue-providers` shows the agent
online, "בדוק חיבור" runs a synthetic verification through the relay — done:
every relevant upload is now verified against the partner's real records.

## How it connects to the TIKET codebase

- `lib/venueVerify.ts` — the engine. Speaks the protocol natively
  (`protocol: "tiket_connect"`), signs each envelope (HMAC + `X-Tiket-Key-Id`),
  and per provider either calls the public URL (`connectionMode: "direct"`) or
  drops the identical signed envelope into the relay (`connectionMode: "agent"`).
- `lib/agentRelay.ts` + `app/api/agent/{enroll,poll,respond}` — the relay:
  agents long-poll outbound; requests/answers travel through the
  `agent_requests` Firestore mailbox, which is untrusted by design (the HMAC
  is verified inside the agent).
- `lib/venueTransfer.ts` — ownership transfer after both Stripe completion
  paths, deterministic `transfer_ref` idempotency, outcomes on
  `ticket.ownershipTransfer` (incl. `newBarcodeFormat`) + `transfer_logs`.
- `lib/providerKeys.ts` + `/api/admin/venue-providers/keys` — key lifecycle
  (generate / retire / revoke, zero-downtime rotation).

Strategy & rollout: `docs/PROVIDER_INTEGRATION_STRATEGY.md`.
