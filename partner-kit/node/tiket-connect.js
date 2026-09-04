"use strict";

/**
 * Tiket Connect — partner-side verification adapter (Node.js, zero dependencies)
 * ==============================================================================
 * Version: 1.2.0 · Protocol: Tiket Connect v1 · Node.js >= 18
 *
 * This single file lets a ticketing company answer TIKET's resale-verification
 * requests. You implement ONE function — lookupTicket(barcode) — against your
 * own database. Everything else (HTTP, HMAC authentication, request validation,
 * field comparison, confidence scoring, response shaping) is handled here.
 *
 * Optionally, implement a second function — transferTicket — to support
 * ownership transfer: when a ticket is resold on TIKET, TIKET asks you to
 * invalidate the seller's barcode and issue the ticket to the buyer. This is
 * the strongest anti-fraud guarantee (the seller's retained PDF copy stops
 * working). Without it, verification still works; transfer requests answer
 * "not_supported".
 *
 * Privacy by construction: the comparison runs inside YOUR infrastructure and
 * the response contains only match/mismatch/not_found + field names. No
 * customer names, emails, phone numbers or payment data ever leave your system.
 *
 * Quick start (standalone):
 *
 *   const { createTiketConnect } = require("./tiket-connect");
 *   const connect = createTiketConnect({
 *     secret: process.env.TIKET_CONNECT_SECRET,
 *     lookupTicket: async (barcode) => {
 *       const row = await db.query("SELECT ... FROM tickets WHERE barcode = ?", [barcode]);
 *       if (!row) return null;
 *       return {
 *         barcode:    row.barcode,
 *         event_name: row.event_name,
 *         venue:      row.venue_name,
 *         date:       row.event_date,        // "YYYY-MM-DD", Date, or "DD/MM/YYYY"
 *         time:       row.event_time,        // "HH:MM" (seconds tolerated)
 *         section:    row.section,           // optional
 *         row:        row.row_number,        // optional
 *         seat:       row.seat_number,       // optional
 *         is_standing: !row.seat_number,     // optional
 *         status:     row.status,            // "active" | "used" | "cancelled" | "refunded" | "transferred"
 *         original_price: row.face_value,    // optional, recommended
 *         ticket_ref: row.id,                // optional — your internal id
 *       };
 *     },
 *   });
 *   connect.listen(8477);
 *
 * Or mount into an existing app (BEFORE any body-parsing middleware):
 *
 *   app.use(connect.middleware);   // Express / Connect / Fastify(middie)
 */

const crypto = require("crypto");
const http = require("http");

const KIT_VERSION = "1.2.0";
const API_VERSION = "1";
const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_TOLERANCE_SECONDS = 300; // replay-protection window
const MATCH_THRESHOLD = 90; // confidence >= this → "match"
const TRANSFER_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // in-memory idempotency window
const TRANSFER_CACHE_MAX = 5000;

// ─── Normalization helpers ───────────────────────────────────────────────────

function normText(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Loose text match: equal, or one contains the other (handles "היכל מנורה" vs "היכל מנורה מבטחים"). */
function textMatches(a, b) {
  const na = normText(a);
  const nb = normText(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Normalize a date (Date | "YYYY-MM-DD" | "DD/MM/YYYY" | ISO datetime) to "YYYY-MM-DD". */
function normDate(value) {
  if (value instanceof Date && !isNaN(value)) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); // ISO date or datetime prefix
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.replace(/\./g, "/").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // DD/MM/YYYY
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return s;
}

/** Normalize "21:00:00" / "21:00" / " 21:00 " to "21:00". */
function normTime(value) {
  const m = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
}

function normSeatPart(value) {
  return normText(value).replace(/^0+(?=\d)/, ""); // "07" == "7"
}

// ─── Signature (Stripe-webhook style) ────────────────────────────────────────

function computeSignature(secret, timestamp, rawBody) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

function timingSafeEqualHex(a, b) {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ─── Comparison / scoring ────────────────────────────────────────────────────
// Weights mirror TIKET's server so both sides agree on what a "match" means:
// barcode 40, artist/event 20, date 20, venue 15, time 5, seat block up to 10.
//
// Two safeguards beyond the raw score:
//  - confidence is normalized to the fields that were actually comparable, so
//    a ticket without seat details isn't penalized for data it never had;
//  - the CRITICAL fields (barcode, artist, date, venue) are hard gates — a
//    ticket that matches everything except the date is a ticket for a
//    different night, not a 90% match.

const CRITICAL_FIELDS = ["barcode", "artist", "date", "venue"];

function compareClaimToRecord(claim, record) {
  const matched = [];
  const unmatched = [];
  let score = 0;
  let maxScore = 0;

  // Barcode — the record was found BY barcode, but verify to catch lookup bugs.
  maxScore += 40;
  if (!record.barcode || normText(record.barcode) === normText(claim.barcode)) {
    score += 40;
    matched.push("barcode");
  } else {
    unmatched.push("barcode");
  }

  // Artist / event name — the claim's artist may appear in either field.
  const recordEvent = record.event_name ?? "";
  const recordArtist = record.artist ?? "";
  const claimedArtist = claim.artist || claim.event_name || "";
  maxScore += 20;
  if (
    textMatches(claimedArtist, recordEvent) ||
    textMatches(claimedArtist, recordArtist) ||
    textMatches(claim.event_name || "", recordEvent)
  ) {
    score += 20;
    matched.push("artist");
  } else {
    unmatched.push("artist");
  }

  maxScore += 20;
  if (normDate(claim.date) === normDate(record.date)) {
    score += 20;
    matched.push("date");
  } else {
    unmatched.push("date");
  }

  maxScore += 15;
  if (textMatches(claim.venue, record.venue)) {
    score += 15;
    matched.push("venue");
  } else {
    unmatched.push("venue");
  }

  if (claim.time && record.time) {
    maxScore += 5;
    if (normTime(claim.time) === normTime(record.time)) {
      score += 5;
      matched.push("time");
    } else {
      unmatched.push("time");
    }
  }

  const recordStanding = Boolean(record.is_standing);
  if (claim.is_standing && recordStanding) {
    maxScore += 10;
    score += 10;
    matched.push("seat_type");
  } else if (!claim.is_standing && !recordStanding) {
    const seatParts = [
      ["section", 4],
      ["row", 3],
      ["seat", 3],
    ];
    for (const [field, weight] of seatParts) {
      if (!claim[field] && !record[field]) continue; // neither side has it — neutral
      maxScore += weight;
      if (normSeatPart(claim[field]) === normSeatPart(record[field])) {
        score += weight;
        matched.push(field);
      } else {
        unmatched.push(field);
      }
    }
  } else {
    maxScore += 10;
    unmatched.push("seat_type"); // one side standing, the other seated
  }

  const confidence = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const criticalFailed = unmatched.some((f) => CRITICAL_FIELDS.includes(f));
  return { confidence, matched, unmatched, criticalFailed };
}

// ─── Core request processing ─────────────────────────────────────────────────

function jsonResponse(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    // A body parser upstream already consumed the stream — signatures need the
    // exact raw bytes, so re-serializing a parsed body is NOT acceptable.
    if (req.readableEnded || (req.body !== undefined && !req.readable)) {
      if (typeof req.rawBody === "string") return resolve(req.rawBody);
      if (Buffer.isBuffer(req.rawBody)) return resolve(req.rawBody.toString("utf8"));
      return reject(
        new Error(
          "tiket-connect: raw request body unavailable. Mount the middleware BEFORE " +
            "body parsers (e.g. express.json()), or expose the raw bytes as req.rawBody."
        )
      );
    }
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("payload too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * Create a Tiket Connect adapter.
 *
 * @param {object}   options
 * @param {string}   [options.secret]      Shared secret from TIKET (32+ random chars).
 * @param {object}   [options.secrets]     During key rotation: { keyId: secret, ... }.
 *                     TIKET sends X-Tiket-Key-Id so the right secret is picked;
 *                     configure both the old and the new key, flip when told,
 *                     then remove the old one. Either secret or secrets is required.
 * @param {function} options.lookupTicket  async (barcode, claim) => record | null
 * @param {function} [options.transferTicket]  async (transfer, record) =>
 *                     { ok: true, new_barcode?, barcode_format?, new_ticket_ref?, delivery? } |
 *                     { ok: false, reason? }
 *                   barcode_format tells TIKET how to render new_barcode for
 *                   the gate scanner: "qr" | "code128" | "pdf417" | "aztec" | "ean13".
 *                   Invalidate the old barcode and issue the ticket to the new
 *                   holder. Omit if you don't support transfers (yet).
 * @param {string}   [options.basePath]    Route prefix, default "/tiket".
 * @param {number}   [options.toleranceSeconds]  Signature timestamp window, default 300.
 * @param {object}   [options.logger]      console-like; pass null to silence.
 */
function createTiketConnect(options) {
  const opts = options || {};

  // Accept a single secret, a { keyId: secret } map, or both (merged).
  const secretsById = {};
  if (opts.secrets && typeof opts.secrets === "object") {
    for (const [keyId, value] of Object.entries(opts.secrets)) {
      if (value && String(value).length >= 16) secretsById[keyId] = String(value);
    }
  }
  if (opts.secret && String(opts.secret).length >= 16) {
    secretsById["__default__"] = String(opts.secret);
  }
  if (Object.keys(secretsById).length === 0) {
    throw new Error(
      "tiket-connect: options.secret or options.secrets is required (16+ characters, 32+ recommended)"
    );
  }
  if (typeof opts.lookupTicket !== "function") {
    throw new Error("tiket-connect: options.lookupTicket function is required");
  }
  if (opts.transferTicket !== undefined && typeof opts.transferTicket !== "function") {
    throw new Error("tiket-connect: options.transferTicket must be a function when provided");
  }
  const lookupTicket = opts.lookupTicket;
  const transferTicket = opts.transferTicket || null;
  const basePath = (opts.basePath || "/tiket").replace(/\/$/, "");
  const tolerance = Number(opts.toleranceSeconds) > 0 ? Number(opts.toleranceSeconds) : DEFAULT_TOLERANCE_SECONDS;
  const logger = opts.logger === null ? { info() {}, warn() {}, error() {} } : opts.logger || console;

  // In-memory idempotency for transfers: a retried transfer_ref answers with
  // the original result instead of transferring twice. Survives retries, not
  // restarts — durable idempotency belongs in YOUR transferTicket (keyed on
  // transfer_ref). See INTEGRATION_GUIDE.md §4.
  const transferCache = new Map(); // transfer_ref → { at, statusCode, body }

  function rememberTransfer(ref, statusCode, body) {
    if (transferCache.size >= TRANSFER_CACHE_MAX) {
      const oldest = transferCache.keys().next().value;
      transferCache.delete(oldest);
    }
    transferCache.set(ref, { at: Date.now(), statusCode, body });
  }

  /**
   * Shared for /verify and /transfer: read raw body, check the HMAC, parse
   * JSON. Returns the parsed payload, or null after writing the error response.
   */
  async function readAndAuthenticate(req, res) {
    let rawBody;
    try {
      rawBody = await readRawBody(req);
    } catch (err) {
      const status = err.statusCode || 500;
      logger.error("[tiket-connect]", err.message);
      jsonResponse(res, status, { error: status === 413 ? "payload_too_large" : "body_unavailable" });
      return null;
    }

    const timestamp = req.headers["x-tiket-timestamp"];
    const signature = req.headers["x-tiket-signature"];
    if (!timestamp || !signature) {
      jsonResponse(res, 401, { error: "missing_signature" });
      return null;
    }
    const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (!Number.isFinite(skew) || skew > tolerance) {
      jsonResponse(res, 401, { error: "timestamp_out_of_range" });
      return null;
    }

    // Key selection: an X-Tiket-Key-Id header picks the matching secret; when
    // absent (or unknown, e.g. mid-rotation), every configured secret is tried.
    const keyId = req.headers["x-tiket-key-id"];
    const candidates =
      keyId && secretsById[keyId] ? [secretsById[keyId]] : Object.values(secretsById);
    const valid = candidates.some((candidate) =>
      timingSafeEqualHex(computeSignature(candidate, timestamp, rawBody), signature)
    );
    if (!valid) {
      logger.warn("[tiket-connect] invalid signature rejected");
      jsonResponse(res, 401, { error: "invalid_signature" });
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = undefined;
    }
    if (!parsed || typeof parsed !== "object") {
      jsonResponse(res, 400, { error: "invalid_json" });
      return null;
    }
    return parsed;
  }

  async function handleVerify(req, res) {
    const payload = await readAndAuthenticate(req, res);
    if (!payload) return;

    const claim = payload && payload.ticket;
    if (!claim || typeof claim !== "object" || !claim.barcode) {
      return jsonResponse(res, 400, { error: "missing_ticket_barcode" });
    }
    const requestId = payload.request_id || null;

    // ── Lookup in the partner's system ──
    let record;
    try {
      record = await lookupTicket(String(claim.barcode), claim);
    } catch (err) {
      logger.error("[tiket-connect] lookupTicket threw:", err);
      return jsonResponse(res, 500, { error: "lookup_failed" });
    }

    const base = { api_version: API_VERSION, request_id: requestId };

    if (!record) {
      logger.info(`[tiket-connect] not_found barcode=…${String(claim.barcode).slice(-4)}`);
      return jsonResponse(res, 200, {
        ...base,
        result: "not_found",
        confidence: 0,
        matched_fields: [],
        unmatched_fields: [],
      });
    }

    const { confidence, matched, unmatched, criticalFailed } = compareClaimToRecord(claim, record);
    const status = record.status ? String(record.status) : "active";
    const isMatch = confidence >= MATCH_THRESHOLD && !criticalFailed;

    const response = {
      ...base,
      result: isMatch ? "match" : "mismatch",
      confidence,
      matched_fields: matched,
      unmatched_fields: unmatched,
      ticket_status: status,
    };
    if (record.ticket_ref !== undefined) response.ticket_ref = String(record.ticket_ref);
    if (record.event_ref !== undefined) response.event_ref = String(record.event_ref);
    if (Number.isFinite(Number(record.original_price))) {
      response.original_price = Number(record.original_price);
      response.currency = record.currency ? String(record.currency) : "ILS";
    }

    logger.info(
      `[tiket-connect] ${response.result} confidence=${confidence} status=${status} barcode=…${String(claim.barcode).slice(-4)}`
    );
    return jsonResponse(res, 200, response);
  }

  async function handleTransfer(req, res) {
    const payload = await readAndAuthenticate(req, res);
    if (!payload) return;

    const transfer = payload && payload.transfer;
    if (!transfer || typeof transfer !== "object" || !transfer.barcode || !transfer.transfer_ref) {
      return jsonResponse(res, 400, { error: "missing_transfer_fields" });
    }
    const holder = transfer.new_holder;
    if (!holder || typeof holder !== "object" || (!holder.email && !holder.phone)) {
      return jsonResponse(res, 400, { error: "missing_new_holder_contact" });
    }

    const transferRef = String(transfer.transfer_ref);
    const base = { api_version: API_VERSION, request_id: payload.request_id || null, transfer_ref: transferRef };

    // Idempotent replay — answer exactly what we answered the first time.
    const cached = transferCache.get(transferRef);
    if (cached && Date.now() - cached.at < TRANSFER_CACHE_TTL_MS) {
      logger.info(`[tiket-connect] transfer replay ref=${transferRef} (cached)`);
      return jsonResponse(res, cached.statusCode, cached.body);
    }

    if (!transferTicket) {
      return jsonResponse(res, 200, { ...base, result: "not_supported" });
    }

    // Find the ticket first — consistent not_found semantics with /verify,
    // and gives your transferTicket the full record.
    let record;
    try {
      record = await lookupTicket(String(transfer.barcode), null);
    } catch (err) {
      logger.error("[tiket-connect] lookupTicket threw during transfer:", err);
      return jsonResponse(res, 500, { error: "lookup_failed" });
    }
    if (!record) {
      return jsonResponse(res, 200, { ...base, result: "not_found" });
    }

    const status = record.status ? String(record.status) : "active";
    if (status !== "active") {
      const body = { ...base, result: "rejected", reason: `ticket_not_active:${status}` };
      rememberTransfer(transferRef, 200, body);
      return jsonResponse(res, 200, body);
    }

    let outcome;
    try {
      outcome = await transferTicket(
        {
          barcode: String(transfer.barcode),
          ticket_ref: transfer.ticket_ref !== undefined ? String(transfer.ticket_ref) : undefined,
          transfer_ref: transferRef,
          new_holder: {
            first_name: holder.first_name ? String(holder.first_name) : "",
            last_name: holder.last_name ? String(holder.last_name) : "",
            email: holder.email ? String(holder.email) : "",
            phone: holder.phone ? String(holder.phone) : "",
          },
        },
        record
      );
    } catch (err) {
      logger.error("[tiket-connect] transferTicket threw:", err);
      return jsonResponse(res, 500, { error: "transfer_failed" });
    }

    if (!outcome || outcome.ok !== true) {
      const body = {
        ...base,
        result: "rejected",
        reason: outcome && outcome.reason ? String(outcome.reason) : "rejected_by_provider",
      };
      rememberTransfer(transferRef, 200, body);
      logger.info(`[tiket-connect] transfer rejected ref=${transferRef} reason=${body.reason}`);
      return jsonResponse(res, 200, body);
    }

    const body = {
      ...base,
      result: "transferred",
      old_barcode_invalidated: true,
      delivery: outcome.delivery ? String(outcome.delivery) : outcome.new_barcode ? "new_barcode" : "provider",
    };
    if (outcome.new_barcode !== undefined) body.new_barcode = String(outcome.new_barcode);
    const barcodeFormat = outcome.barcode_format || record.barcode_format;
    if (body.new_barcode && barcodeFormat) body.barcode_format = String(barcodeFormat);
    if (outcome.new_ticket_ref !== undefined) body.new_ticket_ref = String(outcome.new_ticket_ref);
    rememberTransfer(transferRef, 200, body);
    logger.info(
      `[tiket-connect] transferred ref=${transferRef} barcode=…${String(transfer.barcode).slice(-4)} delivery=${body.delivery}`
    );
    return jsonResponse(res, 200, body);
  }

  /**
   * Raw Node handler. Returns true if the request was handled (path matched),
   * false otherwise — so it can sit in front of an existing router.
   */
  function tryHandle(req, res) {
    const path = (req.url || "").split("?")[0].replace(/\/$/, "");

    if (path === `${basePath}/health`) {
      if (req.method !== "GET") {
        jsonResponse(res, 405, { error: "method_not_allowed" });
        return true;
      }
      jsonResponse(res, 200, {
        ok: true,
        kit_version: KIT_VERSION,
        api_version: API_VERSION,
        transfer_supported: Boolean(transferTicket),
      });
      return true;
    }

    const post = (fn) => {
      if (req.method !== "POST") {
        jsonResponse(res, 405, { error: "method_not_allowed" });
        return true;
      }
      fn(req, res).catch((err) => {
        logger.error("[tiket-connect] unhandled error:", err);
        if (!res.headersSent) jsonResponse(res, 500, { error: "internal_error" });
      });
      return true;
    };

    if (path === `${basePath}/verify`) return post(handleVerify);
    if (path === `${basePath}/transfer`) return post(handleTransfer);

    return false;
  }

  /** Express/Connect-style middleware: passes through non-Tiket routes. */
  function middleware(req, res, next) {
    if (!tryHandle(req, res) && typeof next === "function") next();
  }

  /** Start a dedicated HTTP server (simplest deployment). */
  function listen(port, callback) {
    const server = http.createServer((req, res) => {
      if (!tryHandle(req, res)) jsonResponse(res, 404, { error: "not_found" });
    });
    server.listen(port, () => {
      logger.info(`[tiket-connect] listening on port ${port} (kit v${KIT_VERSION}, API v${API_VERSION})`);
      if (typeof callback === "function") callback(server);
    });
    return server;
  }

  return { handler: tryHandle, middleware, listen };
}

module.exports = {
  createTiketConnect,
  computeSignature,
  compareClaimToRecord,
  KIT_VERSION,
  API_VERSION,
  // Exposed for the shared spec test vectors (spec/test-vectors.json) — every
  // implementation of the protocol must agree on these, byte for byte.
  normalizers: { normText, normDate, normTime, normSeatPart },
};
