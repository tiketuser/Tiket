"use strict";

/**
 * End-to-end harness for the agent's relay loop, no TIKET stack needed:
 * plays the relay (enroll → poll → respond) and asserts the agent's answers.
 *
 *   node e2e-fake-relay.js /path/to/tiket-agent
 *
 * Exercises: enrollment, signed verify (match), signed transfer (+idempotent
 * replay), and a forged-signature envelope (must answer 401).
 */

const crypto = require("crypto");
const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const SECRET = "e2e-secret-0123456789abcdef012345";
const KEY_ID = "k_e2e";
const AGENT_BIN = process.argv[2];
if (!AGENT_BIN) {
  console.error("usage: node e2e-fake-relay.js /path/to/tiket-agent");
  process.exit(2);
}

const sign = (ts, body) =>
  crypto.createHmac("sha256", SECRET).update(`${ts}.${body}`).digest("hex");

const envelope = (kind, payload, { forge = false } = {}) => {
  const body = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  return {
    request_id: `e2e-${kind}-${Math.random().toString(36).slice(2)}`,
    kind,
    path: `/tiket/${kind}`,
    headers: {
      "X-Tiket-Timestamp": ts,
      "X-Tiket-Signature": forge ? "0".repeat(64) : sign(ts, body),
      "X-Tiket-Version": "1",
      "X-Tiket-Key-Id": KEY_ID,
    },
    body,
  };
};

const verifyPayload = {
  api_version: "1",
  request_id: "e2e-1",
  ticket: {
    barcode: "1000000000001",
    event_name: "עומר אדם — סיבוב קיץ",
    artist: "עומר אדם",
    venue: "היכל מנורה",
    date: "2030-08-15",
    time: "21:00",
    section: "A", row: "012", seat: "07",
    is_standing: false,
  },
};
const transferPayload = {
  api_version: "1",
  request_id: "e2e-2",
  transfer: {
    barcode: "1000000000001",
    transfer_ref: "TIKET-E2E-1",
    new_holder: { first_name: "דנה", last_name: "כהן", email: "buyer@example.com", phone: "0501234567" },
  },
};

// Work queue the fake relay hands to the agent, then the expectations.
const queue = [
  envelope("verify", verifyPayload),
  envelope("transfer", transferPayload),
  envelope("transfer", transferPayload), // idempotent replay
  envelope("verify", verifyPayload, { forge: true }), // must 401
];
const answers = [];

const relay = http.createServer((req, res) => {
  const send = (code, obj) => {
    const body = JSON.stringify(obj ?? {});
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(body);
  };
  if (req.url === "/api/agent/enroll" && req.method === "POST") {
    return send(200, { agent_id: "agent-e2e", agent_key: "key-e2e", provider_id: "prov-e2e", provider_name: "E2E Provider" });
  }
  if (req.url === "/api/agent/poll" && req.method === "GET") {
    if (req.headers.authorization !== "Bearer key-e2e") return send(401, { error: "unauthorized" });
    const work = queue.shift();
    if (!work) { res.writeHead(204); return res.end(); }
    return send(200, work);
  }
  if (req.url === "/api/agent/respond" && req.method === "POST") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      answers.push(JSON.parse(raw));
      send(200, { ok: true });
      if (answers.length === 4) setTimeout(finish, 100);
    });
    return;
  }
  send(404, { error: "not_found" });
});

// The partner's real example lookup endpoint (same demo barcode).
const lookupProc = spawn("node", [path.join(__dirname, "../examples/lookup-endpoint/node/lookup.js")], {
  env: { ...process.env, PORT: "18080" },
  stdio: "ignore",
});

// The partner's transfer hook — counts calls so the idempotency assertion is real.
let transferHookCalls = 0;
const transferHook = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    transferHookCalls++;
    const { transfer } = JSON.parse(raw);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      new_barcode: `REISSUED-${transfer.transfer_ref}`,
      barcode_format: "qr",
      delivery: "new_barcode",
    }));
  });
});
transferHook.listen(18081, "127.0.0.1");

// Wait until the lookup example is actually serving before the agent starts.
async function waitForLookup(tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch("http://127.0.0.1:18080/tiket/lookup?barcode=1000000000001");
      if (res.status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("lookup example never came up on :18080");
}

let agentProc;
relay.listen(18077, "127.0.0.1", async () => {
  await waitForLookup();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tiket-e2e-"));
  fs.writeFileSync(path.join(dir, "tiket-agent.conf"), [
    "relay_url = http://127.0.0.1:18077",
    `secret.${KEY_ID} = ${SECRET}`,
    "lookup_mode = http",
    "lookup_url = http://127.0.0.1:18080/tiket/lookup",
    "transfer_url = http://127.0.0.1:18081/transfer",
    `credentials_file = ${path.join(dir, "creds.json")}`,
  ].join("\n"));

  const enroll = spawn(AGENT_BIN, ["enroll", "--token", "e2e-pairing-token-000000", "--config", path.join(dir, "tiket-agent.conf")], { stdio: "inherit" });
  enroll.on("exit", (code) => {
    if (code !== 0) { console.error("✗ enroll failed"); process.exit(1); }
    agentProc = spawn(AGENT_BIN, ["run", "--config", path.join(dir, "tiket-agent.conf")], { stdio: "inherit" });
  });
});

const timeout = setTimeout(() => { console.error("✗ e2e timed out"); cleanup(1); }, 30000);

function finish() {
  clearTimeout(timeout);
  let failures = 0;
  const check = (name, ok, detail) => {
    if (ok) console.log(`  ✓ ${name}`);
    else { console.error(`  ✗ ${name}\n    ${detail}`); failures++; }
  };
  const byIndex = (i) => ({ status: answers[i].http_status, body: JSON.parse(answers[i].body) });

  const a0 = byIndex(0);
  check("relayed verify → match", a0.status === 200 && a0.body.result === "match",
    JSON.stringify(answers[0]));
  const a1 = byIndex(1);
  check("relayed transfer → transferred + qr barcode",
    a1.status === 200 && a1.body.result === "transferred" && a1.body.barcode_format === "qr",
    JSON.stringify(answers[1]));
  const a2 = byIndex(2);
  check("replayed transfer_ref → identical answer, hook ran once",
    a2.body.result === "transferred" && a2.body.new_barcode === a1.body.new_barcode && transferHookCalls === 1,
    `hookCalls=${transferHookCalls} ${JSON.stringify(answers[2])}`);
  const a3 = byIndex(3);
  check("forged signature → 401", a3.status === 401, JSON.stringify(answers[3]));

  console.log(failures === 0 ? "\n4/4 relay e2e checks passed 🎉" : `\n${4 - failures}/4 passed`);
  cleanup(failures === 0 ? 0 : 1);
}

function cleanup(code) {
  agentProc?.kill();
  lookupProc.kill();
  transferHook.close();
  relay.close();
  process.exit(code);
}
