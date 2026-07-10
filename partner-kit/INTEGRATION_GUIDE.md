# Tiket Connect — Integration Guide for Provider Engineering Teams

**Audience:** the technical team of a ticketing company (primary ticket issuer)
partnering with TIKET (tiket.co.il) for verified ticket resale.
**Protocol version:** 1.1 · **Agent:** 1.0.0 · **Node kit:** 1.2.0
**Estimated effort:** 10 minutes (zero-code) to half a day (full transfer support).

> ## תקציר בעברית (TL;DR)
>
> TIKET הוא מרקטפלייס ישראלי לכרטיסי יד-שנייה. כדי לחסום זיופים, אנחנו מאמתים כל
> כרטיס שעולה למכירה מול המערכת שהנפיקה אותו — כלומר מולכם.
>
> **הדרך המומלצת — Agent:** תוכנה קטנה (קובץ בינארי אחד או קונטיינר) שרצה בתוך
> הרשת שלכם ומתקשרת **החוצה בלבד** אל TIKET. אתם לא פותחים אף פורט, לא צריכים
> כתובת ציבורית, לא תעודת TLS ולא שינוי בפיירוול — אין שום דבר אצלכם שחשוף
> לאינטרנט. את הנתונים ה-Agent קורא או מ-endpoint פנימי קטן שאתם כותבים
> (~20 שורות, בכל שפה) או — **בלי לכתוב קוד בכלל** — משאילתת SELECT אחת עם
> משתמש דאטהבייס לקריאה-בלבד.
>
> **מה לא יוצא מהמערכת שלכם:** שום פרט לקוח. ההשוואה רצה אצלכם; התשובה היא רק
> "תואם / לא תואם / לא נמצא" + שמות שדות. כל בקשה חתומה HMAC-SHA256 (המודל של
> Stripe webhooks) ומאומתת בתוך ה-Agent — גם אם הדרך באמצע נפרצת, אי אפשר לזייף
> בקשה.
>
> **שלב אופציונלי ומומלץ — העברת בעלות:** כשמכירה מתבצעת, אתם מבטלים את הברקוד
> הישן ומנפיקים את הכרטיס לקונה. העותק ששמר המוכר מפסיק לעבוד בכניסה לאולם.
>
> ניתוח אבטחה מלא לצוות שלכם: `SECURITY.md`. שאלות: partnerships@tiket.co.il

---

## 0. Choose your path

All three paths speak the same signed protocol and give TIKET the same
verdicts — pick by what's easiest for *your* infrastructure:

| Path | You deploy | You write | Inbound exposure | Best for |
| --- | --- | --- | --- | --- |
| **A. Agent** (recommended) | one static binary / container | 0–20 lines | **none** — outbound only | everyone, especially locked-down networks |
| **B. Self-hosted endpoint** | a small HTTPS service | ~50 lines from the spec | one public URL | teams that prefer owning the service, any language |
| **C. Node embed** | nothing new | one function | your existing app's | Node.js shops with a public API host already |

Whatever the path: **no customer PII ever leaves your system** during
verification, and every request is HMAC-signed and verified inside your
deployment. Full threat model: [`SECURITY.md`](SECURITY.md).

---

## 1. Path A — the Tiket Connect Agent (recommended)

The agent runs inside your network and makes **outbound-only** HTTPS
connections to TIKET (the SAP Cloud Connector / Cloudflare Tunnel pattern).
Nothing on your side is reachable from the internet; your firewall team does
nothing beyond (maybe) allowing egress to `tiket.co.il:443`.

Full agent docs: [`agent/README.md`](agent/README.md). The short version:

**1. Get your ticket data connected — two options:**

- **~20 lines of code** (any language): an *internal-only* HTTP route,
  barcode in → ticket JSON out. Copy-paste starters for Node/PHP/Python/.NET/
  Java in [`examples/lookup-endpoint/`](examples/lookup-endpoint/).
- **Zero code:** give the agent one read-only `SELECT` (Postgres / MySQL /
  SQL Server) with a **read-only DB user**. Column aliases map to the
  protocol fields — no mapping configuration.

**2. Configure** (`tiket-agent.conf`): the shared secret TIKET generated for
you + your lookup source. See [`agent/config.example.conf`](agent/config.example.conf).

**3. Enroll once** with the one-time pairing token TIKET sends you:

```
tiket-agent enroll --token <pairing token>
tiket-agent run
```

TIKET's panel shows the agent online within seconds, and a "test connection"
runs a synthetic verification end to end. Run `tiket-agent selftest` anytime
to validate a build with no TIKET involvement.

Run it as a systemd unit, Windows service, or container — recipes in the
agent README. Verify the binary against `SHA256SUMS` from the release.

---

## 2. Path B / C — hosting the endpoint yourself

You host `POST /tiket/verify` (+ `GET /tiket/health`, optional
`POST /tiket/transfer`) on a public HTTPS URL that TIKET calls directly.

**Path C (Node):** copy `node/tiket-connect.js` (single file, zero
dependencies, Node ≥ 18) into your codebase and wire one function:

```js
const { createTiketConnect } = require("./tiket-connect");

const connect = createTiketConnect({
  secret: process.env.TIKET_CONNECT_SECRET,
  // During key rotation, accept both:  secrets: { k_old: "…", k_new: "…" }

  lookupTicket: async (barcode) => {
    const row = await db.get("SELECT * FROM tickets WHERE barcode = ?", [barcode]);
    if (!row) return null;                     // unknown barcode → not_found
    return {
      barcode:        row.barcode,
      event_name:     row.event_name,
      venue:          row.venue_name,
      date:           row.event_date,          // Date object, "YYYY-MM-DD" or "DD/MM/YYYY"
      time:           row.event_time,          // "HH:MM" (seconds tolerated)
      section:        row.section,             // optional — omit for standing
      row:            row.row_number,          // optional
      seat:           row.seat_number,         // optional
      is_standing:    !row.seat_number,        // optional
      status:         row.status,              // "active" | "used" | "cancelled" | "refunded" | "transferred"
      original_price: row.face_value_ils,      // optional, recommended (scalping detection)
      ticket_ref:     row.id,                  // optional — helps joint debugging
      barcode_format: "qr",                    // optional — what your gate scanners read
    };
  },
});

connect.listen(8477);                 // standalone process, or:
app.use(connect.middleware);          // mount into Express — BEFORE express.json()!
                                      // (the HMAC covers the raw bytes)
```

Notes on the record you return:

- Return it **as it is in your system** — the kit normalizes date formats,
  "07" vs "7" seats, partial venue names, whitespace. Don't pre-clean.
- `status` matters: a cancelled/refunded/used ticket is blocked from resale
  even when every field matches.
- Missing fields are excluded from scoring, never counted against the seller.
- The kit never writes anywhere; a **read-only DB user** is the right shape.

Then `node selftest.js` (23 checks: auth, replay, tamper, matching semantics,
key rotation, transfer + idempotency, and the shared protocol vectors) and
send TIKET your public base URL.

**Path B (any other stack):** implement [`openapi.yaml`](openapi.yaml)
directly — the full recipe and signature test vectors are in §5.

---

## 3. Security & privacy model (all paths)

### Request signing (Stripe-webhooks style)

Every `POST` carries:

```
X-Tiket-Timestamp: 1700000000            ← Unix seconds at signing time
X-Tiket-Signature: 60d2ad7e…             ← hex( HMAC_SHA256( secret, timestamp + "." + rawBody ) )
X-Tiket-Version:   1
X-Tiket-Key-Id:    k_ab12cd34            ← optional: names the signing key (rotation)
```

Verification rules (agent and kit both do all of this):

1. Reject if the timestamp is more than **300 seconds** from server time.
2. Recompute the signature over the **raw request bytes** and compare
   **constant-time**. With multiple configured secrets, `X-Tiket-Key-Id`
   selects one; when absent, all non-revoked secrets are tried.
3. Only then parse the JSON and touch your data.

**Key rotation** is zero-downtime: TIKET generates a new key (old one keeps
signing as "retiring"), you add the new secret alongside the old, TIKET flips,
you drop the old one. No agreed maintenance window needed.

### Privacy — what leaves your system

The verify response contains **only**: `result`
(`match`/`mismatch`/`not_found`), confidence, matched/unmatched field *names*,
`ticket_status`, and optionally your internal ref + face value. **Never**
customer names, contact details, payment data, or the correct values of
unmatched fields. If a seller claims seat 12 and the truth is seat 14, TIKET
learns only that `seat` didn't match.

The single intentional exception is `/tiket/transfer` (§4), where the
*buyer's* contact details flow **to you** — the minimum needed to issue the
ticket to its new lawful holder.

## 4. Ownership transfer (optional, strongly recommended)

Verification alone catches fake tickets at listing time — but a *real* ticket
resold anywhere still carries a risk: the seller kept the PDF. Barcode
re-issue closes that hole for good.

When a ticket sells, TIKET sends (same HMAC auth, works on every path):

```json
{ "api_version": "1", "request_id": "…",
  "transfer": {
    "barcode": "1000000000001",
    "ticket_ref": "LN-88231",
    "transfer_ref": "TIKET-pi_3NqXyz-aB3dE9",
    "new_holder": { "first_name": "דנה", "last_name": "כהן",
                    "email": "dana@example.com", "phone": "0501234567" } } }
```

You implement one more function (Node shown; agent paths use the equivalent
`transfer_url` hook — see `examples/lookup-endpoint/README.md`):

```js
transferTicket: async (transfer, record) => {
  // 1. Durable idempotency: same transfer_ref → same answer, no second transfer.
  const existing = await db.get(
    "SELECT * FROM ticket_transfers WHERE transfer_ref = ?", [transfer.transfer_ref]);
  if (existing) return { ok: true, new_barcode: existing.new_barcode,
                         barcode_format: "qr", delivery: "new_barcode" };

  // 2. Invalidate the old barcode, issue to the buyer — reuse the same
  //    routine your box office uses for name changes.
  const newBarcode = await tickets.reissue(record.ticket_ref, transfer.new_holder,
                                           { idempotencyKey: transfer.transfer_ref });

  return { ok: true, new_barcode: newBarcode, barcode_format: "qr", delivery: "new_barcode" };
  // Can't reissue? → return { ok: false, reason: "…" }
}
```

Already guaranteed before your code runs: the request is authentic and
well-formed, the barcode exists (unknown → `not_found` without touching your
transfer code), the ticket is `active`, and rapid retries of the same
`transfer_ref` are absorbed in memory. **Durable** idempotency across restarts
is your side's one responsibility — one small table keyed on `transfer_ref`.

Delivery models — return whichever fits how you issue tickets:

| `delivery` | Meaning |
| --- | --- |
| `"new_barcode"` | You return the re-issued barcode (+ `barcode_format`: `qr` / `code128` / `pdf417` / `aztec` / `ean13` — REQUIRED so TIKET renders something your gate scanners actually read). |
| `"email"` | You email the new ticket directly to `new_holder.email`. |
| `"app"` | The ticket appears in the buyer's account in *your* app/site. |

Skipping transfer entirely is fine: the endpoint answers `not_supported`,
TIKET falls back to manual handover, verification keeps working, and
`/tiket/health` (or the agent heartbeat) tells TIKET which mode you're in.

**Note on PII:** this is the one place data flows *toward* you — the buyer's
contact details, sent so you can issue the ticket to its lawful new holder.
TIKET's terms cover this handoff; treat it like any customer record you issue
tickets for.

## 5. Implementing from scratch (Path B recipe)

Everything you need is in `openapi.yaml`. The complete recipe:

1. `GET /tiket/health` → `{"ok":true,"kit_version":"yours","api_version":"1","transfer_supported":false}`.
2. `POST /tiket/verify`:
   - read the **raw body bytes** before any framework body-parsing;
   - check `|now − X-Tiket-Timestamp| ≤ 300`;
   - `expected = hex(hmac_sha256(secret, timestamp + "." + rawBody))`,
     constant-time-compare with `X-Tiket-Signature`; on failure → HTTP 401;
   - parse JSON, look up `ticket.barcode`;
   - not found → `{"result":"not_found","confidence":0,…}` (HTTP **200** — a
     valid business answer, not an error);
   - found → compare event/artist, date, venue, time, seat details; respond
     `match` only if **barcode, artist/event, date and venue** all agree and
     the ticket is active; otherwise `mismatch` with the unmatched field names.
3. Validate your comparison and normalization against
   [`spec/test-vectors.json`](spec/test-vectors.json) — the same file both
   reference implementations must pass. If your implementation disagrees with
   a vector, your implementation is wrong (or you've found a spec bug — tell us).

### Signature test vector

```
secret:     test-secret
timestamp:  1700000000
body:       {"api_version":"1","request_id":"example-001","ticket":{"barcode":"1234567890123","event_name":"Demo Show","artist":"Demo Artist","venue":"Demo Hall","date":"2030-01-01","time":"21:00","section":"","row":"","seat":"","is_standing":true}}

signature:  60d2ad7e90165e0308d1a39638c8391d97806d31d0396fc605c07faa9d227fd3
```

(Single line, no trailing newline; the signed string is `timestamp + "." + body`.
More vectors, including key-id cases, in `spec/test-vectors.json`.)

Equivalent in other stacks, for orientation:

```csharp
// C# / .NET
using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
var sig = Convert.ToHexString(
    hmac.ComputeHash(Encoding.UTF8.GetBytes($"{timestamp}.{rawBody}"))).ToLower();
```

```php
// PHP
$sig = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);
```

```python
# Python
sig = hmac.new(secret.encode(), f"{timestamp}.{raw_body}".encode(), hashlib.sha256).hexdigest()
```

## 6. Testing a self-hosted deployment with curl

```bash
SECRET="your-shared-secret"
TS=$(date +%s)
BODY='{"api_version":"1","request_id":"manual-test-1","ticket":{"barcode":"<a real barcode from your test DB>","event_name":"<its event>","venue":"<its venue>","date":"<YYYY-MM-DD>","time":"21:00","is_standing":true}}'
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')

curl -s -X POST "https://your-host/tiket/verify" \
  -H "Content-Type: application/json" \
  -H "X-Tiket-Timestamp: $TS" \
  -H "X-Tiket-Signature: $SIG" \
  -d "$BODY" | jq
```

Run it three ways: a real barcode with correct details (`match`), the same
barcode with a wrong date (`mismatch`, `unmatched_fields:["date"]`), a
nonsense barcode (`not_found`). (Agent path: `tiket-agent selftest` covers
the equivalents, and TIKET's panel test exercises the full relay round trip.)

## 7. Deployment notes

- **Agent path:** egress to `tiket.co.il:443` is the only network requirement.
  No inbound anything.
- **Self-hosted paths:** public TLS (`https://`) required in production; if
  you allow-list callers, coordinate egress IPs with TIKET ops.
- **Load:** one indexed read per request; a few requests per minute at current
  volumes. TIKET times out (default 8–10s) and retries once on 5xx/429.
- **Verification is read-only**, so retries are inherently safe.
- **Logging:** one line per request with the barcode's last 4 digits only.
- **Monitoring:** self-hosted — keep `/tiket/health` in your uptime checks;
  agent — TIKET's panel shows online/offline from the heartbeat, and you can
  watch the process like any other service.

## 8. Go-live checklist

- [ ] Lookup wired to production data through a **read-only** DB user
- [ ] `status` reflects cancellations/refunds/entry-scans (not hardcoded "active")
- [ ] The shared secret lives in an env var / secret store (never committed)
- [ ] Self-test green on the deployment host (`tiket-agent selftest` / `node selftest.js` — includes the shared spec vectors)
- [ ] Agent path: enrolled + panel shows **מחובר** · Self-hosted: `/tiket/health` reachable + TLS
- [ ] TIKET admin "test connection" passes (synthetic barcode → `not_found` is the correct answer)
- [ ] Joint test: one real ticket uploaded on TIKET staging auto-verifies
- [ ] *(transfer)* durably idempotent on `transfer_ref`; `barcode_format` returned with any `new_barcode`
- [ ] *(transfer)* Joint test: staging sale invalidates the old barcode and issues a new one
- [ ] Ops contacts exchanged both ways

## 9. FAQ

**Do we have to run Node? Or Go?** No. Path A's agent is a prebuilt binary
(you write ~20 lines in *your* language, or none); Path B is ~50 lines in any
stack; Node is just where the embeddable adapter is.

**Why is the agent safer than hosting an endpoint?** Nothing on your side is
reachable from the internet — there's no URL to scan, no cert to manage, no
DDoS surface. And requests are still HMAC-verified *inside* the agent, so
even TIKET's own relay infrastructure can't forge one. See `SECURITY.md`.

**Why HMAC instead of an API key?** A leaked bearer key is replayable from
anywhere until rotated. An HMAC signature authenticates *each request body*
within a 5-minute window — interception yields nothing reusable, and body
tampering breaks the signature. It's the model (Stripe/GitHub webhooks) your
team likely already operates.

**What if our barcodes are re-issued after transfers?** Return the *current*
state: old barcode → `status:"transferred"` (blocks resale of the stale copy).

**Can we rate-limit you?** Yes — anything ≥ 10 req/min is comfortable. Answer
429 (self-hosted) and TIKET backs off and retries; the agent naturally
processes one request at a time.

**Does `mismatch` reject the seller automatically?** It's treated as hard
evidence (the barcode exists in your system but the details don't fit), so the
listing won't auto-publish; TIKET staff review the edge cases. `not_found` is
softer — the ticket might simply be another issuer's.

**Schema changes?** `api_version` is pinned to `"1"`; changes are additive
(v1.1 added `X-Tiket-Key-Id` and `barcode_format` — older deployments are
unaffected). Unknown response fields are ignored.

**Contact:** partnerships@tiket.co.il · security reviews: security@tiket.co.il
(start with `SECURITY.md`).
