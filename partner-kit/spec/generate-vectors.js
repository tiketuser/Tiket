"use strict";

/**
 * Regenerates test-vectors.json from the Node reference implementation.
 *
 * The vectors — not any implementation — are the contract: a change to
 * comparison/normalization semantics must land here first, and both the Node
 * kit selftest and the Go agent selftest must pass the same file before
 * release. Run: node partner-kit/spec/generate-vectors.js
 */

const fs = require("fs");
const path = require("path");
const { computeSignature, compareClaimToRecord, normalizers } = require("../node/tiket-connect");

const baseClaim = {
  barcode: "LN1234567890",
  event_name: "עומר אדם — הופעה חיה",
  artist: "עומר אדם",
  venue: "היכל מנורה מבטחים",
  date: "2030-08-15",
  time: "21:00",
  section: "5",
  row: "12",
  seat: "7",
  is_standing: false,
};

const baseRecord = {
  barcode: "LN1234567890",
  event_name: "עומר אדם — הופעה חיה",
  artist: "עומר אדם",
  venue: "היכל מנורה מבטחים",
  date: "2030-08-15",
  time: "21:00",
  section: "5",
  row: "12",
  seat: "7",
  is_standing: false,
  status: "active",
};

const comparisonCases = [
  { name: "exact match, fully seated", claim: baseClaim, record: baseRecord },
  {
    name: "seat parts with leading zeros normalize ('07' == '7')",
    claim: { ...baseClaim, section: "05", row: "012", seat: "07" },
    record: baseRecord,
  },
  {
    name: "wrong date is a critical failure even when everything else matches",
    claim: { ...baseClaim, date: "2030-08-16" },
    record: baseRecord,
  },
  {
    name: "date format equivalence: DD/MM/YYYY claim vs ISO record",
    claim: { ...baseClaim, date: "15/08/2030" },
    record: baseRecord,
  },
  {
    name: "venue containment (claim shorter than record)",
    claim: { ...baseClaim, venue: "היכל מנורה" },
    record: baseRecord,
  },
  {
    name: "artist matches via record event_name only",
    claim: { ...baseClaim, artist: "עומר אדם" },
    record: { ...baseRecord, artist: "" },
  },
  {
    name: "artist mismatch is critical",
    claim: { ...baseClaim, artist: "נועה קירל", event_name: "" },
    record: baseRecord,
  },
  {
    name: "barcode mismatch (lookup bug guard) is critical",
    claim: baseClaim,
    record: { ...baseRecord, barcode: "LN9999999999" },
  },
  {
    name: "standing ticket both sides",
    claim: { ...baseClaim, section: "", row: "", seat: "", is_standing: true },
    record: { ...baseRecord, section: "", row: "", seat: "", is_standing: true },
  },
  {
    name: "claim standing but record seated",
    claim: { ...baseClaim, section: "", row: "", seat: "", is_standing: true },
    record: baseRecord,
  },
  {
    name: "time mismatch alone stays a match (non-critical)",
    claim: { ...baseClaim, time: "20:00" },
    record: baseRecord,
  },
  {
    name: "record without time — field not comparable, no penalty",
    claim: baseClaim,
    record: { ...baseRecord, time: "" },
  },
  {
    name: "seconds tolerated in time ('21:00:00' == '21:00')",
    claim: baseClaim,
    record: { ...baseRecord, time: "21:00:00" },
  },
  {
    name: "single seat-part mismatch (wrong row) is non-critical",
    claim: { ...baseClaim, row: "13" },
    record: baseRecord,
  },
  {
    name: "neither side has seat details — seat fields neutral",
    claim: { ...baseClaim, section: "", row: "", seat: "" },
    record: { ...baseRecord, section: "", row: "", seat: "" },
  },
  {
    name: "wrong venue is critical",
    claim: { ...baseClaim, venue: "פארק הירקון" },
    record: baseRecord,
  },
];

const MATCH_THRESHOLD = 90;

const comparison = comparisonCases.map(({ name, claim, record }) => {
  const r = compareClaimToRecord(claim, record);
  return {
    name,
    claim,
    record,
    expected: {
      confidence: r.confidence,
      matched_fields: r.matched,
      unmatched_fields: r.unmatched,
      critical_failed: r.criticalFailed,
      result: r.confidence >= MATCH_THRESHOLD && !r.criticalFailed ? "match" : "mismatch",
    },
  };
});

const normalization = [];
const normCases = {
  date: ["2030-08-15", "15/08/2030", "15.08.2030", "2030-08-15T21:00:00Z", "1/2/2030", "not a date"],
  time: ["21:00", "21:00:00", " 21:00 ", "9:05", ""],
  text: ["  Foo   Bar ", "ABC", "עומר   אדם", ""],
  seat: ["07", "007", "7", "A12", "0"],
};
for (const [fn, inputs] of Object.entries(normCases)) {
  const impl = {
    date: normalizers.normDate,
    time: normalizers.normTime,
    text: normalizers.normText,
    seat: normalizers.normSeatPart,
  }[fn];
  for (const input of inputs) normalization.push({ fn, input, expected: impl(input) });
}

const signatureSecrets = {
  k_11aa22bb: "spec-secret-A-0123456789abcdef0123456789",
  k_33cc44dd: "spec-secret-B-fedcba9876543210fedcba9876",
};
const sigBody = JSON.stringify({
  api_version: "1",
  request_id: "00000000-0000-4000-8000-000000000000",
  ticket: baseClaim,
});
const signature = [];
for (const [keyId, secret] of Object.entries(signatureSecrets)) {
  signature.push({
    key_id: keyId,
    secret,
    timestamp: "1783776000",
    body: sigBody,
    expected_signature: computeSignature(secret, "1783776000", sigBody),
  });
}
signature.push({
  name: "signature must cover timestamp: same body, different ts, different sig",
  key_id: "k_11aa22bb",
  secret: signatureSecrets.k_11aa22bb,
  timestamp: "1783776001",
  body: sigBody,
  expected_signature: computeSignature(signatureSecrets.k_11aa22bb, "1783776001", sigBody),
});

const vectors = {
  spec: "tiket-connect",
  api_version: "1",
  generated_by: "partner-kit/spec/generate-vectors.js (Node reference implementation)",
  match_threshold: MATCH_THRESHOLD,
  critical_fields: ["barcode", "artist", "date", "venue"],
  signature,
  normalization,
  comparison,
};

const out = path.join(__dirname, "test-vectors.json");
fs.writeFileSync(out, JSON.stringify(vectors, null, 2) + "\n");
console.log(`wrote ${out}: ${signature.length} signature, ${normalization.length} normalization, ${comparison.length} comparison vectors`);
