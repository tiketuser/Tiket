import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";
import { agentTransport, AgentOfflineError } from "./agentRelay";

/**
 * Shared venue ticket verification logic.
 *
 * Extracted from app/api/venue-verify so it can be invoked server-side (e.g.
 * from /api/create-ticket) without an internal HTTP round-trip. The status
 * decision made here is authoritative — clients never get to declare their own
 * verification result.
 *
 * Two provider protocols are supported:
 *  - "tiket_connect": the Tiket Partner Connect standard (see partner-kit/).
 *    HMAC-signed canonical request, standard response schema. Zero mapping
 *    needed — the admin only configures base URL + shared secret.
 *  - "custom": arbitrary provider APIs described declaratively — HTTP method,
 *    endpoint/body templates with {{vars}}, auth style, and dot-path response
 *    mappings. Lets us adapt to gated APIs (Eventim, Ticketmaster) from the
 *    admin panel without code changes.
 */

export interface VerificationRequest {
  barcode?: string;
  artist: string;
  eventName?: string;
  venue: string;
  date: string; // DD/MM/YYYY
  time?: string;
  section?: string;
  row?: string;
  seat?: string;
  isStanding?: boolean;
  _testProviderId?: string;
}

export interface OfficialTicket {
  ticketId: string;
  barcode: string;
  eventId: string;
  eventName: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  eventTime: string;
  section: string;
  row: string;
  seat: string;
  seatType: string;
  ticketStatus: string;
  originalPrice: number;
  ticketingSystem: string;
}

export interface VerificationResponse {
  verified: boolean;
  confidence: number;
  status: "verified" | "needs_review" | "rejected";
  matchedFields: string[];
  unmatchedFields: string[];
  details?: {
    officialTicketId?: string;
    eventId?: string;
    ticketingSystem?: string;
    originalPrice?: number;
    /** Firestore id of the provider that answered — enables ownership transfer after sale. */
    providerId?: string;
  };
  reason: string;
  timestamp: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: string; // "real" | "builtin_demo"
  protocol: "custom" | "tiket_connect";
  /**
   * "direct": TIKET calls the partner's public HTTPS endpoint.
   * "agent": the partner runs the Tiket Connect Agent inside their network;
   * requests are relayed through the agent's outbound connection instead of
   * an inbound call. Same signed envelope either way.
   */
  connectionMode: "direct" | "agent";
  baseUrl: string;
  verifyEndpoint: string; // may contain {{vars}} (URI-encoded on render)
  healthEndpoint: string; // tiket_connect: explicit, falls back to sibling of verify
  transferEndpoint: string; // tiket_connect: explicit, falls back to sibling of verify
  httpMethod: "POST" | "GET";
  authType: "bearer" | "header" | "query" | "hmac";
  authHeaderName: string;
  secondaryCredentialHeaderName?: string;
  requestBodyTemplate: string;
  responseValidField: string;
  responseValidValue?: string; // optional expected value; empty → truthy check
  responseConfidenceField?: string;
  responseTicketIdField?: string;
  responseOriginalPriceField?: string;
  responseMatchedFieldsField?: string;
  responseUnmatchedFieldsField?: string;
  barcodePattern?: string;
  timeoutMs: number;
  priority: number; // lower runs first
  enabled: boolean;
}

/** How a single provider answered, beyond the boolean. */
type ProviderOutcome = "verified" | "mismatch" | "not_found" | "invalid";

interface ProviderCallResult {
  outcome: ProviderOutcome;
  response: VerificationResponse;
  httpStatus: number;
  latencyMs: number;
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_PRIORITY = 100;
export const TIKET_CONNECT_API_VERSION = "1";

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

/** DD/MM/YYYY (or DD.MM.YYYY) → YYYY-MM-DD; passes through if already ISO. */
function toIsoDate(date: string): string {
  const cleaned = date.trim().replace(/\./g, "/");
  const dmyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return date;
}

function buildTemplateVars(req: VerificationRequest): Record<string, string> {
  return {
    barcode: req.barcode ?? "",
    artist: req.artist,
    event_name: req.eventName || req.artist,
    venue: req.venue,
    date: req.date,
    date_iso: toIsoDate(req.date),
    time: req.time ?? "",
    section: req.section ?? "",
    row: req.row ?? "",
    seat: req.seat ?? "",
    is_standing: req.isStanding ? "true" : "false",
    request_id: crypto.randomUUID(),
  };
}

/**
 * Substitute {{vars}} into a JSON body template. Values are JSON-escaped so an
 * artist name containing a quote can't break the payload (or inject fields).
 */
function renderBodyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key] ?? "";
    return JSON.stringify(value).slice(1, -1); // escape without surrounding quotes
  });
}

/** Substitute {{vars}} into a URL path/query — values are URI-encoded. */
function renderUrlTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => encodeURIComponent(vars[key] ?? ""));
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((curr, key) => {
    if (curr && typeof curr === "object") return (curr as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/** Stripe-webhook-style request signature: hex(hmac_sha256(secret, ts + "." + body)). */
export function signTiketConnect(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

/**
 * Legacy fallback: derive a sibling Tiket Connect endpoint from the verify
 * endpoint for provider docs created before healthEndpoint/transferEndpoint
 * became explicit config fields. New writes always set them explicitly.
 */
function siblingEndpoint(verifyEndpoint: string, sibling: "health" | "transfer"): string {
  const base = verifyEndpoint || "/tiket/verify";
  return base.endsWith("/verify")
    ? `${base.slice(0, -"/verify".length)}/${sibling}`
    : `/tiket/${sibling}`;
}

/** One provider credential. keyId "legacy" = pre-rotation single-secret doc. */
export interface ProviderSecrets {
  /** The active signing secret. */
  secret: string;
  /** Id of the active key, sent as X-Tiket-Key-Id (omitted for "legacy"). */
  keyId: string;
  secondaryKey?: string;
}

export function buildAuthHeaders(
  provider: ProviderConfig,
  secrets: ProviderSecrets,
  rawBody: string
): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (provider.authType === "bearer") {
    headers["Authorization"] = `Bearer ${secrets.secret}`;
  } else if (provider.authType === "header") {
    headers[provider.authHeaderName] = secrets.secret;
  } else if (provider.authType === "hmac") {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    headers["X-Tiket-Timestamp"] = timestamp;
    headers["X-Tiket-Signature"] = signTiketConnect(secrets.secret, timestamp, rawBody);
    headers["X-Tiket-Version"] = TIKET_CONNECT_API_VERSION;
    if (secrets.keyId && secrets.keyId !== "legacy") {
      headers["X-Tiket-Key-Id"] = secrets.keyId;
    }
  }
  // authType === "query" is handled in the URL, not headers.

  if (provider.secondaryCredentialHeaderName && secrets.secondaryKey) {
    headers[provider.secondaryCredentialHeaderName] = secrets.secondaryKey;
  }

  return headers;
}

export function docToProviderConfig(id: string, d: FirebaseFirestore.DocumentData): ProviderConfig {
  const protocol = d.protocol === "tiket_connect" ? "tiket_connect" : "custom";
  const verifyEndpoint = d.verifyEndpoint || "";
  return {
    id,
    name: d.name,
    type: d.type || "real",
    protocol,
    connectionMode: d.connectionMode === "agent" ? "agent" : "direct",
    baseUrl: d.baseUrl || "",
    verifyEndpoint,
    healthEndpoint:
      d.healthEndpoint ||
      (protocol === "tiket_connect" ? siblingEndpoint(verifyEndpoint, "health") : ""),
    transferEndpoint:
      d.transferEndpoint ||
      (protocol === "tiket_connect" ? siblingEndpoint(verifyEndpoint, "transfer") : ""),
    httpMethod: d.httpMethod === "GET" ? "GET" : "POST",
    authType: ["bearer", "header", "query", "hmac"].includes(d.authType) ? d.authType : "bearer",
    authHeaderName: d.authHeaderName || "Authorization",
    secondaryCredentialHeaderName: d.secondaryCredentialHeaderName || "",
    requestBodyTemplate: d.requestBodyTemplate || "",
    responseValidField: d.responseValidField || "valid",
    responseValidValue: d.responseValidValue || "",
    responseConfidenceField: d.responseConfidenceField || "",
    responseTicketIdField: d.responseTicketIdField || "",
    responseOriginalPriceField: d.responseOriginalPriceField || "",
    responseMatchedFieldsField: d.responseMatchedFieldsField || "",
    responseUnmatchedFieldsField: d.responseUnmatchedFieldsField || "",
    barcodePattern: d.barcodePattern || "",
    timeoutMs: Number(d.timeoutMs) > 0 ? Number(d.timeoutMs) : DEFAULT_TIMEOUT_MS,
    priority: Number.isFinite(Number(d.priority)) ? Number(d.priority) : DEFAULT_PRIORITY,
    enabled: d.enabled,
  };
}

// ─── Provider config cache ───────────────────────────────────────────────────
// One Firestore read per instance per minute instead of per verification.
// Admin mutations call invalidateProviderCache(); other instances converge
// within the TTL.

const PROVIDER_CACHE_TTL_MS = 60_000;
let providerCache: { at: number; providers: ProviderConfig[]; demoEnabled: boolean } | null = null;

export function invalidateProviderCache(): void {
  providerCache = null;
}

async function loadProviders(): Promise<{ providers: ProviderConfig[]; demoEnabled: boolean }> {
  if (providerCache && Date.now() - providerCache.at < PROVIDER_CACHE_TTL_MS) {
    return providerCache;
  }

  const providers: ProviderConfig[] = [];
  let demoEnabled = true; // safe default

  if (adminDb) {
    try {
      const snap = await adminDb
        .collection("venue_api_providers")
        .where("enabled", "==", true)
        .get();
      for (const doc of snap.docs) {
        const cfg = docToProviderConfig(doc.id, doc.data());
        if (cfg.type !== "builtin_demo") providers.push(cfg);
      }

      const demoSnap = await adminDb.collection("venue_api_providers").doc("demo").get();
      if (demoSnap.exists) {
        demoEnabled = demoSnap.data()?.enabled !== false;
      }
    } catch (err) {
      console.warn("Could not load providers from Firestore, using demo fallback:", err);
      return { providers: [], demoEnabled: true }; // do not cache failures
    }
  }

  providers.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  providerCache = { at: Date.now(), providers, demoEnabled };
  return providerCache;
}

// ─── Observability ───────────────────────────────────────────────────────────

/**
 * Best-effort audit log + per-provider rolling stats. Never throws; failures
 * here must not affect the verification result. Barcode is truncated to its
 * last 4 characters — logs are for debugging, not a barcode directory.
 */
async function logProviderAttempt(
  provider: ProviderConfig,
  req: VerificationRequest,
  outcome: ProviderOutcome | "error",
  latencyMs: number,
  httpStatus: number | null,
  errorMessage?: string
): Promise<void> {
  if (!adminDb || req._testProviderId) return; // admin tests don't pollute stats
  try {
    const statsUpdate: Record<string, unknown> = {
      "stats.calls": FieldValue.increment(1),
      "stats.totalLatencyMs": FieldValue.increment(latencyMs),
      "stats.lastUsedAt": new Date(),
    };
    if (outcome === "verified") statsUpdate["stats.verified"] = FieldValue.increment(1);
    else if (outcome === "mismatch" || outcome === "invalid")
      statsUpdate["stats.rejected"] = FieldValue.increment(1);
    else if (outcome === "not_found") statsUpdate["stats.notFound"] = FieldValue.increment(1);
    else statsUpdate["stats.errors"] = FieldValue.increment(1);
    if (errorMessage) statsUpdate["stats.lastError"] = errorMessage.slice(0, 300);

    await Promise.all([
      adminDb.collection("venue_api_providers").doc(provider.id).update(statsUpdate),
      adminDb.collection("verification_logs").add({
        providerId: provider.id,
        providerName: provider.name,
        outcome,
        latencyMs,
        httpStatus: httpStatus ?? null,
        barcodeSuffix: req.barcode ? req.barcode.slice(-4) : null,
        artist: req.artist || null,
        venue: req.venue || null,
        date: req.date || null,
        error: errorMessage ? errorMessage.slice(0, 300) : null,
        at: new Date(),
      }),
    ]);
  } catch (err) {
    console.warn(`[venueVerify] stats/log write failed for ${provider.name}:`, err);
  }
}

// ─── Real provider call ──────────────────────────────────────────────────────

function buildRequest(
  provider: ProviderConfig,
  secrets: ProviderSecrets,
  req: VerificationRequest
): { url: string; method: "POST" | "GET"; headers: Record<string, string>; body?: string } {
  const vars = buildTemplateVars(req);

  if (provider.protocol === "tiket_connect") {
    // Canonical envelope — the partner kit validates this exact shape.
    const body = JSON.stringify({
      api_version: TIKET_CONNECT_API_VERSION,
      request_id: vars.request_id,
      ticket: {
        barcode: req.barcode ?? "",
        event_name: req.eventName || req.artist,
        artist: req.artist,
        venue: req.venue,
        date: toIsoDate(req.date),
        time: req.time ?? "",
        section: req.section ?? "",
        row: req.row ?? "",
        seat: req.seat ?? "",
        is_standing: Boolean(req.isStanding),
      },
    });
    const endpoint = provider.verifyEndpoint || "/tiket/verify";
    const hmacProvider: ProviderConfig = { ...provider, authType: "hmac" };
    return {
      url: `${provider.baseUrl}${endpoint}`,
      method: "POST",
      headers: buildAuthHeaders(hmacProvider, secrets, body),
      body,
    };
  }

  // Custom protocol
  let url = `${provider.baseUrl}${renderUrlTemplate(provider.verifyEndpoint, vars)}`;
  const body =
    provider.httpMethod === "GET" ? "" : renderBodyTemplate(provider.requestBodyTemplate, vars);
  const headers = buildAuthHeaders(provider, secrets, body);
  if (provider.httpMethod === "GET") delete headers["Content-Type"];

  if (provider.authType === "query") {
    url += `${url.includes("?") ? "&" : "?"}${provider.authHeaderName}=${encodeURIComponent(secrets.secret)}`;
  }

  return {
    url,
    method: provider.httpMethod,
    headers,
    body: provider.httpMethod === "GET" ? undefined : body,
  };
}

function parseProviderResponse(
  provider: ProviderConfig,
  data: Record<string, unknown>
): { outcome: ProviderOutcome; response: VerificationResponse } {
  const now = new Date().toISOString();

  if (provider.protocol === "tiket_connect") {
    const result = String(data.result ?? "");
    const ticketStatus = data.ticket_status ? String(data.ticket_status) : "active";
    const confidence = Number(data.confidence);
    const matchedFields = Array.isArray(data.matched_fields) ? data.matched_fields.map(String) : [];
    const unmatchedFields = Array.isArray(data.unmatched_fields)
      ? data.unmatched_fields.map(String)
      : [];

    // A "match" on a cancelled/refunded/used ticket is still unsellable.
    const inactive = result === "match" && ticketStatus !== "active";
    const isMatch = result === "match" && !inactive;
    const outcome: ProviderOutcome = isMatch
      ? "verified"
      : result === "not_found"
      ? "not_found"
      : "mismatch"; // "mismatch" answers and inactive tickets are hard evidence

    return {
      outcome,
      response: {
        verified: isMatch,
        confidence: Number.isFinite(confidence) ? confidence : isMatch ? 100 : 0,
        status: isMatch ? "verified" : outcome === "mismatch" ? "rejected" : "needs_review",
        matchedFields,
        unmatchedFields,
        details: {
          officialTicketId: data.ticket_ref ? String(data.ticket_ref) : undefined,
          eventId: data.event_ref ? String(data.event_ref) : undefined,
          ticketingSystem: provider.name,
          originalPrice: Number.isFinite(Number(data.original_price))
            ? Number(data.original_price)
            : undefined,
          providerId: provider.id,
        },
        reason: isMatch
          ? `כרטיס אומת בהצלחה על ידי ${provider.name}`
          : inactive
          ? `הכרטיס נמצא אצל ${provider.name} אך אינו פעיל (${ticketStatus})`
          : outcome === "not_found"
          ? `הכרטיס לא נמצא במערכת ${provider.name}`
          : `פרטי הכרטיס לא תואמים לרשומות ${provider.name}`,
        timestamp: now,
      },
    };
  }

  // Custom protocol — declarative dot-path mapping
  const rawValid = resolvePath(data, provider.responseValidField);
  const isValid = provider.responseValidValue
    ? String(rawValid) === provider.responseValidValue
    : Boolean(rawValid);

  const mappedConfidence = provider.responseConfidenceField
    ? Number(resolvePath(data, provider.responseConfidenceField))
    : NaN;
  const mappedMatched = provider.responseMatchedFieldsField
    ? resolvePath(data, provider.responseMatchedFieldsField)
    : undefined;
  const mappedUnmatched = provider.responseUnmatchedFieldsField
    ? resolvePath(data, provider.responseUnmatchedFieldsField)
    : undefined;
  const mappedTicketId = provider.responseTicketIdField
    ? resolvePath(data, provider.responseTicketIdField)
    : undefined;
  const mappedPrice = provider.responseOriginalPriceField
    ? Number(resolvePath(data, provider.responseOriginalPriceField))
    : NaN;

  return {
    outcome: isValid ? "verified" : "invalid",
    response: {
      verified: isValid,
      confidence: Number.isFinite(mappedConfidence) ? mappedConfidence : isValid ? 100 : 0,
      status: isValid ? "verified" : "rejected",
      matchedFields: Array.isArray(mappedMatched)
        ? mappedMatched.map(String)
        : isValid
        ? ["barcode", "artist", "venue", "date"]
        : [],
      unmatchedFields: Array.isArray(mappedUnmatched)
        ? mappedUnmatched.map(String)
        : isValid
        ? []
        : ["barcode"],
      details: {
        officialTicketId: mappedTicketId !== undefined ? String(mappedTicketId) : undefined,
        ticketingSystem: provider.name,
        originalPrice: Number.isFinite(mappedPrice) ? mappedPrice : undefined,
        providerId: provider.id,
      },
      reason: isValid
        ? `כרטיס אומת בהצלחה על ידי ${provider.name}`
        : `הכרטיס לא אומת על ידי ${provider.name}`,
      timestamp: now,
    },
  };
}

/**
 * Deliver one signed protocol request, by the provider's connection mode:
 * "direct" fetches the partner's public URL; "agent" drops the identical
 * signed envelope into the relay mailbox and awaits the agent's answer.
 */
async function dispatchProviderRequest(
  provider: ProviderConfig,
  kind: "verify" | "transfer",
  request: { url: string; method: "POST" | "GET"; headers: Record<string, string>; body?: string }
): Promise<{ status: number; text: string }> {
  if (provider.connectionMode === "agent") {
    const reply = await agentTransport.send(
      provider.id,
      {
        kind,
        path: kind === "verify" ? provider.verifyEndpoint || "/tiket/verify" : provider.transferEndpoint,
        headers: request.headers,
        body: request.body || "",
      },
      provider.timeoutMs
    );
    return { status: reply.httpStatus, text: reply.body };
  }

  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: AbortSignal.timeout(provider.timeoutMs),
  });
  return { status: response.status, text: await response.text() };
}

/**
 * Call one provider with timeout + a single retry on transient failures
 * (network error, 429, 5xx). 4xx responses fail immediately — retrying a bad
 * request or bad credentials cannot help. An offline agent also fails
 * immediately: it cannot come online within a retry backoff.
 */
async function callRealProvider(
  provider: ProviderConfig,
  secrets: ProviderSecrets,
  req: VerificationRequest
): Promise<ProviderCallResult> {
  const started = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 500));

    // Rebuild per attempt so HMAC timestamps stay fresh.
    const request = buildRequest(provider, secrets, req);

    let status: number;
    let text: string;
    try {
      ({ status, text } = await dispatchProviderRequest(provider, "verify", request));
    } catch (err) {
      if (err instanceof AgentOfflineError) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
      continue; // network error / timeout → retry once
    }

    if (status === 429 || status >= 500) {
      lastError = new Error(`${provider.name} API error: HTTP ${status}`);
      continue;
    }
    if (status < 200 || status >= 300) {
      throw new Error(`${provider.name} API error: HTTP ${status}`);
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`${provider.name} returned a non-JSON response`);
    }

    const { outcome, response: parsed } = parseProviderResponse(provider, data);
    return { outcome, response: parsed, httpStatus: status, latencyMs: Date.now() - started };
  }

  throw lastError ?? new Error(`${provider.name}: request failed`);
}

interface StoredKey {
  id: string;
  secret: string;
  status: "active" | "retiring" | "revoked";
  createdAt?: unknown;
}

/**
 * Resolve the active signing credential for a provider.
 *
 * Multi-key schema (`keys[]` + `activeKeyId`) enables zero-downtime rotation:
 * generate a new key (old one becomes "retiring" — partners accepting either
 * keep working), flip the partner, then revoke. Legacy docs that only carry
 * `apiKey` are synthesized into a single "legacy" key at read time; the
 * "legacy" id is never sent on the wire, so pre-rotation partners see
 * byte-identical requests.
 */
export async function getProviderSecrets(providerId: string): Promise<ProviderSecrets> {
  const secretDoc = await adminDb?.collection("venue_api_secrets").doc(providerId).get();
  const data = secretDoc?.data() || {};

  const keys: StoredKey[] = Array.isArray(data.keys)
    ? (data.keys as StoredKey[]).filter((k) => k && k.id && k.secret)
    : [];

  if (keys.length === 0) {
    return { secret: data.apiKey || "", keyId: "legacy", secondaryKey: data.secondaryKey || undefined };
  }

  const active =
    keys.find((k) => k.id === data.activeKeyId && k.status !== "revoked") ||
    keys.find((k) => k.status === "active") ||
    keys.find((k) => k.status !== "revoked");

  return {
    secret: active?.secret || data.apiKey || "",
    keyId: active?.id || "legacy",
    secondaryKey: data.secondaryKey || undefined,
  };
}

// ─── Admin connection test ───────────────────────────────────────────────────

export interface ProviderTestResult {
  ok: boolean;
  providerName: string;
  httpStatus: number | null;
  latencyMs: number;
  outcome: ProviderOutcome | "error" | null;
  healthOk?: boolean; // tiket_connect only — GET {base}/health
  kitVersion?: string;
  transferSupported?: boolean; // tiket_connect only — partner implements ownership transfer
  connectionMode?: "direct" | "agent";
  agentOnline?: boolean; // agent mode — polled within the online window
  agentVersion?: string;
  agentLookupMode?: string;
  agentLastSeenAt?: string | null;
  error?: string;
  responseSnippet?: string;
}

/**
 * Targeted diagnostic for the admin panel's "test connection" button. Bypasses
 * the config cache, calls exactly one provider with a synthetic ticket, and
 * reports what actually happened. A partner answering "not_found" proves the
 * endpoint, auth and schema all work — that reads as success here.
 */
export async function testProvider(providerId: string): Promise<ProviderTestResult> {
  if (!adminDb) {
    return { ok: false, providerName: providerId, httpStatus: null, latencyMs: 0, outcome: null, error: "Database unavailable" };
  }
  const doc = await adminDb.collection("venue_api_providers").doc(providerId).get();
  if (!doc.exists) {
    return { ok: false, providerName: providerId, httpStatus: null, latencyMs: 0, outcome: null, error: "Provider not found" };
  }
  const provider = docToProviderConfig(doc.id, doc.data()!);
  const secrets = await getProviderSecrets(providerId);

  const sample: VerificationRequest = {
    barcode: "TIKET-TEST-0000000000",
    artist: "בדיקת חיבור",
    eventName: "בדיקת חיבור",
    venue: "בדיקת מערכת",
    date: "01/01/2030",
    time: "20:00",
    _testProviderId: providerId,
  };

  const result: ProviderTestResult = {
    ok: false,
    providerName: provider.name,
    httpStatus: null,
    latencyMs: 0,
    outcome: null,
    connectionMode: provider.connectionMode,
  };

  if (provider.connectionMode === "agent") {
    // No public URL to health-check — the agent's heartbeat is the liveness signal.
    const status = await agentTransport.status(providerId);
    result.agentOnline = status.online;
    result.agentVersion = status.agentVersion;
    result.agentLookupMode = status.lookupMode;
    result.agentLastSeenAt = status.lastSeenAt ?? null;
    result.healthOk = status.online;
    if (status.agentVersion) result.kitVersion = status.agentVersion;
    if (!status.online) {
      result.outcome = "error";
      result.error = status.agentId
        ? "Agent enrolled but not connected (no recent poll)"
        : "No agent enrolled for this provider";
      return result;
    }
  } else if (provider.protocol === "tiket_connect") {
    try {
      const healthUrl = `${provider.baseUrl}${provider.healthEndpoint}`;
      const healthRes = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      result.healthOk = healthRes.ok;
      if (healthRes.ok) {
        const health = await healthRes.json().catch(() => ({}));
        if (health?.kit_version) result.kitVersion = String(health.kit_version);
        if (health?.transfer_supported !== undefined) {
          result.transferSupported = Boolean(health.transfer_supported);
        }
      }
    } catch {
      result.healthOk = false;
    }
  }

  const started = Date.now();
  try {
    const call = await callRealProvider(provider, secrets, sample);
    result.latencyMs = call.latencyMs;
    result.httpStatus = call.httpStatus;
    result.outcome = call.outcome;
    // Any well-formed answer (incl. not_found) means the integration works.
    result.ok = true;
    result.responseSnippet = JSON.stringify(call.response.reason).slice(0, 300);
  } catch (err) {
    result.latencyMs = Date.now() - started;
    result.outcome = "error";
    const msg = err instanceof Error ? err.message : String(err);
    result.error = msg.slice(0, 300);
    const statusMatch = msg.match(/HTTP (\d{3})/);
    if (statusMatch) result.httpStatus = Number(statusMatch[1]);
  }

  return result;
}

// ─── Demo / mock verification ────────────────────────────────────────────────

async function fetchMockVenueData(): Promise<OfficialTicket[]> {
  const firestoreMockTickets: OfficialTicket[] = [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection("mock_tickets").get();
      snap.forEach((doc) => {
        const d = doc.data();
        firestoreMockTickets.push({
          ticketId: doc.id,
          barcode: d.barcode || "",
          eventId: d.eventId || "",
          eventName: d.eventName || "",
          artistName: d.artistName || "",
          venueName: d.venueName || "",
          eventDate: d.eventDate || "",
          eventTime: d.eventTime || "",
          section: d.section || "",
          row: d.row || "",
          seat: d.seat || "",
          seatType: d.seatType || "seated",
          ticketStatus: "active",
          originalPrice: d.originalPrice || 0,
          ticketingSystem: "Tiket",
        });
      });
    } catch {
      // ignore, fall through to static data
    }
  }

  // The static mock file is a development-only fixture. Loading it in
  // production would let anyone read known-good barcodes from a public URL and
  // replay them to force a "verified" result, so it is gated to non-production.
  if (process.env.NODE_ENV !== "production") {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/venue-api-mock.json`, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        const staticTickets: OfficialTicket[] = data.official_tickets || [];
        return [...firestoreMockTickets, ...staticTickets];
      }
    } catch {
      // fall through
    }
  }

  return firestoreMockTickets;
}

function verifyTicketAgainstMock(
  uploaded: VerificationRequest,
  officialTickets: OfficialTicket[]
): VerificationResponse {
  let bestMatch: OfficialTicket | null = null;
  let matchScore = 0;
  let matchedFields: string[] = [];
  let unmatchedFields: string[] = [];

  const normalizeDate = (d: string) => d.replace(/\./g, "/");
  const uploadedDate = normalizeDate(uploaded.date);

  for (const official of officialTickets) {
    let currentScore = 0;
    const currentMatched: string[] = [];
    const currentUnmatched: string[] = [];

    if (uploaded.barcode && uploaded.barcode === official.barcode) {
      currentScore += 40;
      currentMatched.push("barcode");
    } else if (uploaded.barcode) {
      currentUnmatched.push("barcode");
    }

    const artistMatch =
      normalizeString(uploaded.artist).includes(normalizeString(official.artistName)) ||
      normalizeString(official.artistName).includes(normalizeString(uploaded.artist));
    if (artistMatch) { currentScore += 20; currentMatched.push("artist"); }
    else { currentUnmatched.push("artist"); }

    if (uploadedDate === normalizeDate(official.eventDate)) {
      currentScore += 20; currentMatched.push("date");
    } else { currentUnmatched.push("date"); }

    const venueMatch =
      normalizeString(uploaded.venue).includes(normalizeString(official.venueName)) ||
      normalizeString(official.venueName).includes(normalizeString(uploaded.venue));
    if (venueMatch) { currentScore += 15; currentMatched.push("venue"); }
    else { currentUnmatched.push("venue"); }

    if (uploaded.time && uploaded.time === official.eventTime) {
      currentScore += 5; currentMatched.push("time");
    }

    if (!uploaded.isStanding && official.seatType === "seated") {
      if (uploaded.section === official.section) { currentScore += 4; currentMatched.push("section"); }
      else if (uploaded.section) { currentUnmatched.push("section"); }
      if (uploaded.row === official.row) { currentScore += 3; currentMatched.push("row"); }
      else if (uploaded.row) { currentUnmatched.push("row"); }
      if (uploaded.seat === official.seat) { currentScore += 3; currentMatched.push("seat"); }
      else if (uploaded.seat) { currentUnmatched.push("seat"); }
    } else if (uploaded.isStanding && official.seatType === "standing") {
      currentScore += 10; currentMatched.push("seatType");
    }

    if (currentScore > matchScore) {
      matchScore = currentScore;
      bestMatch = official;
      matchedFields = currentMatched;
      unmatchedFields = currentUnmatched;
    }
  }

  const confidence = Math.min(matchScore, 100);
  let status: "verified" | "needs_review" | "rejected";
  let reason: string;

  // The date is a hard gate: everything-but-the-date matching describes a
  // ticket for a different night of the same tour, not a 90% match.
  if (confidence >= 90 && matchedFields.includes("date")) {
    status = "verified";
    reason = `כרטיס אומת בהצלחה! תואם ${matchedFields.length} שדות במערכת ${bestMatch?.ticketingSystem}`;
  } else if (confidence >= 40) {
    status = "needs_review";
    reason = matchedFields.length > 0
      ? `התאמה חלקית - נדרשת בדיקה ידנית. תואם: ${matchedFields.join(", ")}`
      : `הכרטיס לא נמצא במאגר האולמות - נדרשת בדיקה ידנית`;
  } else {
    status = "needs_review";
    reason = `הכרטיס לא נמצא במאגר האולמות - נדרשת בדיקה ידנית של מנהל`;
  }

  return {
    verified: status === "verified",
    confidence,
    status,
    matchedFields,
    unmatchedFields,
    details: bestMatch
      ? {
          officialTicketId: bestMatch.ticketId,
          eventId: bestMatch.eventId,
          ticketingSystem: bestMatch.ticketingSystem,
          originalPrice: bestMatch.originalPrice,
        }
      : undefined,
    reason,
    timestamp: new Date().toISOString(),
  };
}

// ─── Public entry point ──────────────────────────────────────────────────────

/**
 * Run authoritative server-side verification for a ticket.
 *
 * Provider routing: providers whose barcodePattern matches the barcode are
 * "targeted" and consulted exclusively; otherwise every enabled provider is
 * consulted in priority order. A negative answer is a hard rejection only when
 * it is real evidence:
 *   - a *targeted* provider says the barcode is invalid, or
 *   - a Tiket Connect partner answers "mismatch" (barcode exists in their
 *     system but the details differ) or reports the ticket as not active.
 * An un-targeted "not_found" proves nothing — the ticket may simply belong to
 * a different ticketing system — so it falls through to the demo matcher /
 * manual review instead of silently rejecting a legitimate ticket.
 */
export async function verifyTicket(body: VerificationRequest): Promise<VerificationResponse> {
  if (!body.artist || !body.venue || !body.date) {
    return {
      verified: false,
      confidence: 0,
      status: "rejected",
      matchedFields: [],
      unmatchedFields: ["artist", "venue", "date"],
      reason: "Missing required fields for verification",
      timestamp: new Date().toISOString(),
    };
  }

  let { providers, demoEnabled } = await loadProviders();

  // Legacy admin-test path: restrict to the named provider, never fall back.
  if (body._testProviderId) {
    providers = providers.filter((p) => p.id === body._testProviderId);
    demoEnabled = false;
  }

  // Barcode-pattern routing
  let matchedProviders = providers;
  let targeted = false;
  if (body.barcode) {
    const patternMatched = providers.filter((p) => {
      if (!p.barcodePattern) return false;
      try { return new RegExp(p.barcodePattern).test(body.barcode!); } catch { return false; }
    });
    if (patternMatched.length > 0) {
      matchedProviders = patternMatched;
      targeted = true;
    }
  }

  let hardRejection: VerificationResponse | null = null;

  for (const provider of matchedProviders) {
    try {
      const secrets = await getProviderSecrets(provider.id);
      const call = await callRealProvider(provider, secrets, body);
      await logProviderAttempt(provider, body, call.outcome, call.latencyMs, call.httpStatus);

      if (call.outcome === "verified") return call.response;

      // Hard evidence of a bad ticket — remember it (first one wins), but a
      // later provider vouching for the ticket would still override it.
      const isHardEvidence =
        call.outcome === "mismatch" || (targeted && call.outcome === "invalid");
      if (isHardEvidence && !hardRejection) {
        hardRejection = call.response;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Provider ${provider.name} error:`, err);
      await logProviderAttempt(provider, body, "error", 0, null, msg);
    }
  }

  if (hardRejection) {
    return { ...hardRejection, status: "rejected", verified: false };
  }

  // Fall back to demo mode
  if (demoEnabled || providers.length === 0) {
    const mockData = await fetchMockVenueData();
    return verifyTicketAgainstMock(body, mockData);
  }

  return {
    verified: false,
    confidence: 0,
    status: "needs_review",
    matchedFields: [],
    unmatchedFields: [],
    reason: "הכרטיס לא אומת על ידי אף ספק — נדרשת בדיקה ידנית",
    timestamp: new Date().toISOString(),
  };
}
