# Tiket Connect — protocol spec vectors

`test-vectors.json` is the **single source of truth** for the deterministic
parts of the protocol that every implementation must agree on, byte for byte:

| Section | What it pins down |
| --- | --- |
| `signature` | HMAC-SHA256 request signing (`hex(hmac(secret, ts + "." + body))`), including key-id cases |
| `normalization` | Date / time / text / seat-number normalization before comparison |
| `comparison` | Field comparison, confidence scoring, critical-field gates, match threshold |

Consumed by:

- `node/selftest.js` (Node reference kit)
- `tiket-agent selftest` (Go agent)

## The consistency rule

**Any change to comparison or normalization semantics lands here first**, then
in the implementations. Both selftests must pass the same vectors file before a
release. An implementation that "fixes" behavior without a vector change is a
protocol violation, not a fix — TIKET trusts partner verdicts rather than
recomputing them, so silent divergence between implementations means identical
tickets verify differently depending on which adapter a partner runs.

Behaviors that are *stateful or transport-level* (auth rejections, replay
window, transfer idempotency, `barcode_format` passthrough, `not_found` for a
null lookup) are intentionally **not** vectors — each implementation's selftest
covers them with equivalent live-loop scenarios.

## Regenerating

```
node partner-kit/spec/generate-vectors.js
```

Regenerates the file from the Node reference implementation. Review the diff —
every changed expectation is a protocol change and must be intentional.
