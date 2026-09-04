# Internal lookup endpoint — copy-paste examples

When running the **Tiket Connect Agent** in `http` mode, this endpoint is the
only code your team writes (~20 real lines): the agent calls it locally with a
barcode, you answer with the ticket as JSON (or 404).

| Your stack | File | Run |
| --- | --- | --- |
| Node.js | [`node/lookup.js`](node/lookup.js) | `node lookup.js` |
| PHP | [`php/lookup.php`](php/lookup.php) | `php -S 127.0.0.1:8080 lookup.php` |
| Python | [`python/lookup.py`](python/lookup.py) | `python3 lookup.py` |
| .NET | [`dotnet/Lookup.cs`](dotnet/Lookup.cs) | `dotnet run` |
| Java | [`java/Lookup.java`](java/Lookup.java) | `javac Lookup.java && java Lookup` |

Every example runs out of the box with one demo ticket (barcode
`1000000000001`) and contains the commented real-database version.

## The contract

```
GET {lookup_url}?barcode=<barcode>

200 → {
  "barcode": "…", "event_name": "…", "venue": "…",
  "date": "YYYY-MM-DD", "time": "HH:MM",
  "section": "…", "row": "…", "seat": "…", "is_standing": false,
  "status": "active",              // active|used|cancelled|refunded|transferred
  "original_price": 350,           // optional, recommended
  "ticket_ref": "…",               // optional — your internal id
  "barcode_format": "qr"           // optional — qr|code128|pdf417|aztec|ean13
}
404 → unknown barcode
```

Rules of the road:

- **Internal only.** Bind to localhost or a private interface. No auth or TLS
  needed precisely *because* it must never be reachable from outside — the
  agent (running beside it) is the only caller.
- **Read-only.** This endpoint must not mutate anything.
- Missing optional fields are fine — the comparison only scores fields that
  exist on both sides.

## Optional: ownership transfer hook

To support resale ownership transfer (invalidate the seller's barcode, issue
to the buyer), add one more internal route and set `transfer_url`:

```
POST {transfer_url}
{ "transfer": { "barcode", "ticket_ref", "transfer_ref",
                "new_holder": { "first_name", "last_name", "email", "phone" } },
  "record": { …the same record your lookup returned… } }

200 → { "ok": true, "new_barcode": "…", "barcode_format": "qr",
        "delivery": "new_barcode" }         // or "email" | "app" | "provider"
      { "ok": false, "reason": "…" }
```

Make it **durably idempotent on `transfer_ref`** (one small table: seen
`transfer_ref` → stored answer). The agent absorbs quick retries in memory,
but replay protection across restarts belongs in your database.
