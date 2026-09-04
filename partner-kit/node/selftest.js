"use strict";

/**
 * Tiket Connect self-test — verifies your deployment end-to-end WITHOUT
 * involving TIKET. Boots the adapter on a local port with demo data, then
 * fires signed and unsigned requests at it and checks every answer.
 *
 *   node selftest.js
 *
 * All checks green → the kit itself is working; deploy it wired to your real
 * database and send TIKET the public URL + your shared secret.
 */

const assert = require("assert");
const {
  createTiketConnect,
  computeSignature,
  compareClaimToRecord,
  normalizers,
  KIT_VERSION,
  API_VERSION,
} = require("./tiket-connect");

// Shared protocol spec vectors — the Go agent's selftest consumes the SAME
// file. If this suite disagrees with the vectors, fix the implementation or
// change the vectors first (never silently diverge).
const SPEC_VECTORS = require("../spec/test-vectors.json");

const SECRET = "selftest-secret-0123456789abcdef";

// Demo "database": one seated ticket, one standing, one cancelled.
const DEMO_TICKETS = {
  "1000000000001": {
    barcode: "1000000000001",
    event_name: "עומר אדם — סיבוב קיץ",
    venue: "היכל מנורה מבטחים",
    date: "2030-08-15",
    time: "21:00",
    section: "A",
    row: "12",
    seat: "7",
    status: "active",
    original_price: 350,
    ticket_ref: "DEMO-1",
  },
  "1000000000002": {
    barcode: "1000000000002",
    event_name: "נועה קירל",
    venue: "פארק הירקון",
    date: "2030-09-01",
    time: "20:30",
    is_standing: true,
    status: "active",
    original_price: 280,
    ticket_ref: "DEMO-2",
  },
  "1000000000003": {
    barcode: "1000000000003",
    event_name: "הופעה שבוטלה",
    venue: "היכל התרבות",
    date: "2030-10-10",
    time: "20:00",
    is_standing: true,
    status: "cancelled",
    ticket_ref: "DEMO-3",
  },
};

async function post(baseUrl, path, payload, { sign = true, timestamp } = {}) {
  const rawBody = JSON.stringify(payload);
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const headers = { "Content-Type": "application/json" };
  if (sign) {
    headers["X-Tiket-Timestamp"] = String(ts);
    headers["X-Tiket-Signature"] = computeSignature(SECRET, ts, rawBody);
  }
  const res = await fetch(`${baseUrl}${path}`, { method: "POST", headers, body: rawBody });
  return { status: res.status, body: await res.json() };
}

function claim(overrides) {
  return {
    api_version: API_VERSION,
    request_id: `selftest-${Math.random().toString(36).slice(2)}`,
    ticket: {
      barcode: "1000000000001",
      event_name: "עומר אדם — סיבוב קיץ",
      artist: "עומר אדם",
      venue: "היכל מנורה",
      date: "2030-08-15",
      time: "21:00",
      section: "A",
      row: "12",
      seat: "7",
      is_standing: false,
      ...overrides,
    },
  };
}

async function main() {
  let transferCalls = 0;
  const connect = createTiketConnect({
    secret: SECRET,
    logger: null,
    lookupTicket: (barcode) => DEMO_TICKETS[barcode] || null,
    transferTicket: (transfer) => {
      transferCalls++;
      return {
        ok: true,
        new_barcode: `REISSUED-${transfer.transfer_ref}`,
        barcode_format: "qr",
        new_ticket_ref: "DEMO-1-B",
        delivery: "new_barcode",
      };
    },
  });

  const server = connect.listen(0);
  await new Promise((resolve) => server.on("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  let passed = 0;
  const check = (name, fn) => {
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}\n    ${err.message}`);
      process.exitCode = 1;
    }
  };

  console.log(`Tiket Connect self-test (kit v${KIT_VERSION}, API v${API_VERSION})\n`);

  // 1. Health
  const health = await fetch(`${baseUrl}/tiket/health`).then((r) => r.json());
  check("health endpoint answers", () => assert.strictEqual(health.ok, true));

  // 2. Perfect match
  let r = await post(baseUrl, "/tiket/verify", claim());
  check("valid ticket → match", () => {
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.result, "match");
    assert.ok(r.body.confidence >= 90, `confidence ${r.body.confidence} < 90`);
    assert.strictEqual(r.body.original_price, 350);
    assert.strictEqual(r.body.ticket_ref, "DEMO-1");
  });

  // 3. Fuzzy tolerance: partial venue name + padded seat numbers still match
  r = await post(baseUrl, "/tiket/verify", claim({ venue: "מנורה מבטחים", row: "012", seat: "07" }));
  check("fuzzy venue/seat formats → match", () => {
    assert.strictEqual(r.body.result, "match");
  });

  // 4. Wrong date → mismatch, date listed as unmatched
  r = await post(baseUrl, "/tiket/verify", claim({ date: "2030-08-16" }));
  check("wrong date → mismatch", () => {
    assert.strictEqual(r.body.result, "mismatch");
    assert.ok(r.body.unmatched_fields.includes("date"));
  });

  // 5. Unknown barcode → not_found
  r = await post(baseUrl, "/tiket/verify", claim({ barcode: "9999999999999" }));
  check("unknown barcode → not_found", () => {
    assert.strictEqual(r.body.result, "not_found");
  });

  // 6. Standing ticket matches without seat details
  r = await post(baseUrl, "/tiket/verify", {
    ...claim({
      barcode: "1000000000002",
      event_name: "נועה קירל",
      artist: "נועה קירל",
      venue: "פארק הירקון",
      date: "2030-09-01",
      time: "20:30",
      section: "",
      row: "",
      seat: "",
      is_standing: true,
    }),
  });
  check("standing ticket → match", () => assert.strictEqual(r.body.result, "match"));

  // 7. Cancelled ticket reports its status
  r = await post(baseUrl, "/tiket/verify", claim({
    barcode: "1000000000003",
    event_name: "הופעה שבוטלה",
    artist: "הופעה שבוטלה",
    venue: "היכל התרבות",
    date: "2030-10-10",
    time: "20:00",
    section: "", row: "", seat: "",
    is_standing: true,
  }));
  check("cancelled ticket → ticket_status=cancelled", () => {
    assert.strictEqual(r.body.ticket_status, "cancelled");
  });

  // 8. Missing signature → 401
  r = await post(baseUrl, "/tiket/verify", claim(), { sign: false });
  check("unsigned request → 401", () => assert.strictEqual(r.status, 401));

  // 9. Stale timestamp → 401 (replay protection)
  r = await post(baseUrl, "/tiket/verify", claim(), { timestamp: Math.floor(Date.now() / 1000) - 3600 });
  check("stale timestamp → 401", () => assert.strictEqual(r.status, 401));

  // 10. Tampered body → 401
  {
    const payload = claim();
    const rawBody = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000);
    const sig = computeSignature(SECRET, ts, rawBody);
    const tampered = rawBody.replace("1000000000001", "1000000000002");
    const res = await fetch(`${baseUrl}/tiket/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tiket-Timestamp": String(ts),
        "X-Tiket-Signature": sig,
      },
      body: tampered,
    });
    check("tampered body → 401", () => assert.strictEqual(res.status, 401));
  }

  // ── Ownership transfer ──

  const transferPayload = (overrides) => ({
    api_version: API_VERSION,
    request_id: `selftest-${Math.random().toString(36).slice(2)}`,
    transfer: {
      barcode: "1000000000001",
      ticket_ref: "DEMO-1",
      transfer_ref: "TIKET-TX-0001",
      new_holder: { first_name: "דנה", last_name: "כהן", email: "buyer@example.com", phone: "0501234567" },
      ...overrides,
    },
  });

  // 11. Health advertises transfer support
  const health2 = await fetch(`${baseUrl}/tiket/health`).then((x) => x.json());
  check("health advertises transfer_supported", () =>
    assert.strictEqual(health2.transfer_supported, true)
  );

  // 12. Valid transfer → transferred + reissued barcode (with its symbology)
  r = await post(baseUrl, "/tiket/transfer", transferPayload());
  check("valid transfer → transferred", () => {
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.result, "transferred");
    assert.strictEqual(r.body.new_barcode, "REISSUED-TIKET-TX-0001");
    assert.strictEqual(r.body.barcode_format, "qr");
    assert.strictEqual(r.body.old_barcode_invalidated, true);
  });

  // 13. Replayed transfer_ref → same answer, no second transfer
  r = await post(baseUrl, "/tiket/transfer", transferPayload());
  check("replayed transfer_ref → idempotent", () => {
    assert.strictEqual(r.body.result, "transferred");
    assert.strictEqual(r.body.new_barcode, "REISSUED-TIKET-TX-0001");
    assert.strictEqual(transferCalls, 1, `transferTicket ran ${transferCalls} times, expected 1`);
  });

  // 14. Transfer of unknown barcode → not_found
  r = await post(baseUrl, "/tiket/transfer", transferPayload({ barcode: "9999999999999", transfer_ref: "TIKET-TX-0002" }));
  check("transfer unknown barcode → not_found", () => assert.strictEqual(r.body.result, "not_found"));

  // 15. Transfer of a cancelled ticket → rejected before your code runs
  r = await post(baseUrl, "/tiket/transfer", transferPayload({ barcode: "1000000000003", transfer_ref: "TIKET-TX-0003" }));
  check("transfer cancelled ticket → rejected", () => {
    assert.strictEqual(r.body.result, "rejected");
    assert.ok(String(r.body.reason).startsWith("ticket_not_active"));
  });

  // 16. Unsigned transfer → 401
  r = await post(baseUrl, "/tiket/transfer", transferPayload({ transfer_ref: "TIKET-TX-0004" }), { sign: false });
  check("unsigned transfer → 401", () => assert.strictEqual(r.status, 401));

  // 17. Adapter without transferTicket answers not_supported
  {
    const bare = createTiketConnect({
      secret: SECRET,
      logger: null,
      lookupTicket: (barcode) => DEMO_TICKETS[barcode] || null,
    });
    const bareServer = bare.listen(0);
    await new Promise((resolve) => bareServer.on("listening", resolve));
    const bareUrl = `http://127.0.0.1:${bareServer.address().port}`;
    const bareHealth = await fetch(`${bareUrl}/tiket/health`).then((x) => x.json());
    r = await post(bareUrl, "/tiket/transfer", transferPayload({ transfer_ref: "TIKET-TX-0005" }));
    check("no transferTicket → not_supported (+health says so)", () => {
      assert.strictEqual(bareHealth.transfer_supported, false);
      assert.strictEqual(r.body.result, "not_supported");
    });
    bareServer.close();
  }

  // ── Key rotation (X-Tiket-Key-Id) ──

  {
    const SECRET_B = "selftest-secret-B-fedcba9876543210";
    const rotating = createTiketConnect({
      secrets: { k_old: SECRET, k_new: SECRET_B },
      logger: null,
      lookupTicket: (barcode) => DEMO_TICKETS[barcode] || null,
    });
    const rotServer = rotating.listen(0);
    await new Promise((resolve) => rotServer.on("listening", resolve));
    const rotUrl = `http://127.0.0.1:${rotServer.address().port}`;

    const signedWith = async (secret, keyId) => {
      const rawBody = JSON.stringify(claim());
      const ts = Math.floor(Date.now() / 1000);
      const headers = {
        "Content-Type": "application/json",
        "X-Tiket-Timestamp": String(ts),
        "X-Tiket-Signature": computeSignature(secret, ts, rawBody),
      };
      if (keyId) headers["X-Tiket-Key-Id"] = keyId;
      const res = await fetch(`${rotUrl}/tiket/verify`, { method: "POST", headers, body: rawBody });
      return res.status;
    };

    // 18. Key id selects the right secret
    const s1 = await signedWith(SECRET_B, "k_new");
    const s2 = await signedWith(SECRET, "k_old");
    check("18: signed with either configured key (+key-id) → 200", () => {
      assert.strictEqual(s1, 200);
      assert.strictEqual(s2, 200);
    });

    // 19. Missing key-id header falls back to trying all configured secrets
    const s3 = await signedWith(SECRET_B, null);
    check("19: no key-id header → all secrets tried → 200", () => assert.strictEqual(s3, 200));

    // 20. Wrong secret still rejected, with or without a key-id
    const s4 = await signedWith("wrong-secret-000000000000000000", "k_new");
    check("20: wrong secret → 401", () => assert.strictEqual(s4, 401));

    rotServer.close();
  }

  // ── Shared spec vectors (partner-kit/spec/test-vectors.json) ──

  check("21: spec signature vectors", () => {
    for (const v of SPEC_VECTORS.signature) {
      assert.strictEqual(
        computeSignature(v.secret, v.timestamp, v.body),
        v.expected_signature,
        v.name || v.key_id
      );
    }
  });

  check("22: spec normalization vectors", () => {
    const impls = {
      date: normalizers.normDate,
      time: normalizers.normTime,
      text: normalizers.normText,
      seat: normalizers.normSeatPart,
    };
    for (const v of SPEC_VECTORS.normalization) {
      assert.strictEqual(impls[v.fn](v.input), v.expected, `${v.fn}(${JSON.stringify(v.input)})`);
    }
  });

  check("23: spec comparison vectors", () => {
    for (const v of SPEC_VECTORS.comparison) {
      const r = compareClaimToRecord(v.claim, v.record);
      const result =
        r.confidence >= SPEC_VECTORS.match_threshold && !r.criticalFailed ? "match" : "mismatch";
      assert.strictEqual(r.confidence, v.expected.confidence, `${v.name}: confidence`);
      assert.deepStrictEqual(r.matched, v.expected.matched_fields, `${v.name}: matched`);
      assert.deepStrictEqual(r.unmatched, v.expected.unmatched_fields, `${v.name}: unmatched`);
      assert.strictEqual(r.criticalFailed, v.expected.critical_failed, `${v.name}: critical`);
      assert.strictEqual(result, v.expected.result, `${v.name}: result`);
    }
  });

  const TOTAL = 23;
  server.close();
  console.log(`\n${passed}/${TOTAL} checks passed${passed === TOTAL ? " — the kit is ready 🎉" : ""}`);
}

main().catch((err) => {
  console.error("self-test crashed:", err);
  process.exit(1);
});
