import { adminAuth, adminDb } from "./firebaseAdmin";
import {
  buildAuthHeaders,
  docToProviderConfig,
  getProviderSecrets,
  ProviderConfig,
  TIKET_CONNECT_API_VERSION,
} from "./venueVerify";
import { agentTransport, AgentOfflineError } from "./agentRelay";
import crypto from "crypto";

/**
 * Ownership transfer — the second half of the Tiket Connect protocol.
 *
 * When a ticket sells on TIKET, we ask the issuing provider to invalidate the
 * seller's barcode and issue the ticket to the buyer. This is what makes the
 * resale safe: the PDF copy the seller kept stops opening gates.
 *
 * Transfers are a mutation, so unlike verification they are never scatter-shot:
 * we only send the request when we know which provider issued the ticket —
 * via the providerId recorded at verification time, a barcode-pattern match,
 * or the recorded ticketing-system name. The transfer_ref is deterministic per
 * (payment, ticket), and the partner kit is idempotent on it, so the Stripe
 * webhook and the confirm-payment route can both fire without double-issuing.
 */

export interface BuyerContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface TransferOutcome {
  status:
    | "transferred"
    | "rejected"
    | "not_found"
    | "not_supported"
    | "no_provider"
    | "no_barcode"
    | "skipped"
    | "error";
  providerId?: string;
  providerName?: string;
  transferRef?: string;
  newBarcode?: string;
  /** Symbology of newBarcode (qr | code128 | pdf417 | aztec | ean13) — how to render it scannably. */
  newBarcodeFormat?: string;
  newTicketRef?: string;
  delivery?: string;
  reason?: string;
}

/** Resolve who the buyer is — registered user (via Firebase Auth) or guest. */
export async function resolveBuyerContact(meta: {
  buyerId?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
}): Promise<BuyerContact> {
  if (meta.buyerId && adminAuth) {
    try {
      const user = await adminAuth.getUser(meta.buyerId);
      const nameParts = (user.displayName || "").trim().split(/\s+/);
      return {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      };
    } catch (err) {
      console.warn("[venueTransfer] could not load buyer user:", err);
    }
  }
  return {
    firstName: "",
    lastName: "",
    email: meta.guestEmail || "",
    phone: meta.guestPhone || "",
  };
}

/**
 * Find the tiket_connect provider that issued this ticket. Returns null when
 * we can't tell — transferring through the wrong provider is worse than
 * leaving the ticket in manual-handover mode.
 */
async function resolveIssuingProvider(
  ticket: FirebaseFirestore.DocumentData
): Promise<ProviderConfig | null> {
  if (!adminDb) return null;

  const recordedProviderId: string | undefined = ticket.verificationDetails?.providerId;
  if (recordedProviderId) {
    const doc = await adminDb.collection("venue_api_providers").doc(recordedProviderId).get();
    if (doc.exists) {
      const cfg = docToProviderConfig(doc.id, doc.data()!);
      if (cfg.enabled && cfg.protocol === "tiket_connect") return cfg;
    }
  }

  const snap = await adminDb
    .collection("venue_api_providers")
    .where("enabled", "==", true)
    .get();
  const connectProviders = snap.docs
    .map((d) => docToProviderConfig(d.id, d.data()))
    .filter((p) => p.protocol === "tiket_connect" && p.type !== "builtin_demo");

  const barcode: string | undefined = ticket.barcode || undefined;
  if (barcode) {
    const byPattern = connectProviders.find((p) => {
      if (!p.barcodePattern) return false;
      try { return new RegExp(p.barcodePattern).test(barcode); } catch { return false; }
    });
    if (byPattern) return byPattern;
  }

  const systemName: string | undefined = ticket.verificationDetails?.ticketingSystem;
  if (systemName) {
    const byName = connectProviders.find(
      (p) => p.name.toLowerCase().trim() === String(systemName).toLowerCase().trim()
    );
    if (byName) return byName;
  }

  return null;
}

async function persistOutcome(
  ticketId: string,
  outcome: TransferOutcome,
  latencyMs: number,
  barcode?: string | null
): Promise<void> {
  if (!adminDb) return;
  try {
    await Promise.all([
      adminDb.collection("tickets").doc(ticketId).update({
        ownershipTransfer: {
          status: outcome.status,
          providerId: outcome.providerId || null,
          providerName: outcome.providerName || null,
          transferRef: outcome.transferRef || null,
          newBarcode: outcome.newBarcode || null,
          newBarcodeFormat: outcome.newBarcodeFormat || null,
          newTicketRef: outcome.newTicketRef || null,
          delivery: outcome.delivery || null,
          reason: outcome.reason || null,
          attemptedAt: new Date(),
        },
      }),
      adminDb.collection("transfer_logs").add({
        ticketId,
        providerId: outcome.providerId || null,
        providerName: outcome.providerName || null,
        transferRef: outcome.transferRef || null,
        result: outcome.status,
        reason: outcome.reason || null,
        barcodeFormat: outcome.newBarcodeFormat || null,
        latencyMs,
        barcodeSuffix: barcode ? String(barcode).slice(-4) : null,
        at: new Date(),
      }),
    ]);
  } catch (err) {
    console.warn("[venueTransfer] failed to persist transfer outcome:", err);
  }
}

/**
 * Ask the issuing provider to move one ticket to the buyer. Persists the
 * outcome on the ticket document (`ownershipTransfer`) and in `transfer_logs`.
 * Never throws — sale completion must not fail because a transfer did.
 */
export async function transferTicketOwnership(
  ticketId: string,
  ticket: FirebaseFirestore.DocumentData,
  buyer: BuyerContact,
  transferRef: string
): Promise<TransferOutcome> {
  const started = Date.now();
  const barcode: string | null = ticket.barcode || null;

  const finish = async (outcome: TransferOutcome): Promise<TransferOutcome> => {
    await persistOutcome(ticketId, outcome, Date.now() - started, barcode);
    return outcome;
  };

  try {
    if (!barcode) {
      return finish({ status: "no_barcode", transferRef, reason: "לכרטיס אין ברקוד — אין מה להעביר" });
    }
    if (!buyer.email && !buyer.phone) {
      return finish({
        status: "error",
        transferRef,
        reason: "חסרים פרטי קשר של הקונה (אימייל/טלפון) — הספק לא יכול להנפיק כרטיס",
      });
    }

    const provider = await resolveIssuingProvider(ticket);
    if (!provider) {
      return finish({
        status: "no_provider",
        transferRef,
        reason: "לא זוהה ספק Tiket Connect שהנפיק את הכרטיס — מסירה ידנית",
      });
    }

    const secrets = await getProviderSecrets(provider.id);
    const body = JSON.stringify({
      api_version: TIKET_CONNECT_API_VERSION,
      request_id: crypto.randomUUID(),
      transfer: {
        barcode,
        ticket_ref: ticket.verificationDetails?.officialTicketId || undefined,
        transfer_ref: transferRef,
        new_holder: {
          first_name: buyer.firstName,
          last_name: buyer.lastName,
          email: buyer.email,
          phone: buyer.phone,
        },
      },
    });

    const headers = buildAuthHeaders({ ...provider, authType: "hmac" }, secrets, body);

    let httpStatus: number;
    let responseText: string;
    if (provider.connectionMode === "agent") {
      try {
        const reply = await agentTransport.send(
          provider.id,
          { kind: "transfer", path: provider.transferEndpoint, headers, body },
          provider.timeoutMs
        );
        httpStatus = reply.httpStatus;
        responseText = reply.body;
      } catch (err) {
        return finish({
          status: "error",
          providerId: provider.id,
          providerName: provider.name,
          transferRef,
          reason:
            err instanceof AgentOfflineError
              ? "ה-Agent של הספק אינו מחובר — נסו שוב מאוחר יותר"
              : `שגיאת ממסר: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300),
        });
      }
    } else {
      const response = await fetch(`${provider.baseUrl}${provider.transferEndpoint}`, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(provider.timeoutMs),
      });
      httpStatus = response.status;
      responseText = await response.text();
    }

    if (httpStatus < 200 || httpStatus >= 300) {
      return finish({
        status: "error",
        providerId: provider.id,
        providerName: provider.name,
        transferRef,
        reason: `HTTP ${httpStatus} מהספק`,
      });
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(responseText);
    } catch {
      return finish({
        status: "error",
        providerId: provider.id,
        providerName: provider.name,
        transferRef,
        reason: "תשובת ספק לא תקינה (JSON)",
      });
    }
    const result = String(data.result ?? "");
    const normalized: TransferOutcome["status"] =
      result === "transferred"
        ? "transferred"
        : result === "not_found"
        ? "not_found"
        : result === "not_supported"
        ? "not_supported"
        : result === "rejected"
        ? "rejected"
        : "error";

    return finish({
      status: normalized,
      providerId: provider.id,
      providerName: provider.name,
      transferRef,
      newBarcode: data.new_barcode ? String(data.new_barcode) : undefined,
      newBarcodeFormat: data.barcode_format ? String(data.barcode_format) : undefined,
      newTicketRef: data.new_ticket_ref ? String(data.new_ticket_ref) : undefined,
      delivery: data.delivery ? String(data.delivery) : undefined,
      reason: data.reason ? String(data.reason) : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[venueTransfer] transfer failed for ticket ${ticketId}:`, err);
    return finish({ status: "error", transferRef, reason: msg.slice(0, 300) });
  }
}

/**
 * Post-sale hook shared by the Stripe webhook and the confirm-payment route.
 * Best-effort: outcomes land on each ticket's `ownershipTransfer` field, and
 * failures are retried by an admin via the "transfer" ticket action.
 *
 * The transfer_ref `TIKET-{paymentIntent}-{ticketId}` is deterministic, so
 * when both callers race, the partner's idempotency answers the second call
 * with the first call's result.
 */
export async function transferTicketsAfterSale(
  ticketIds: string[],
  buyerMeta: { buyerId?: string | null; guestEmail?: string | null; guestPhone?: string | null },
  paymentIntentId: string
): Promise<void> {
  if (!adminDb || ticketIds.length === 0) return;

  const buyer = await resolveBuyerContact(buyerMeta);

  for (const ticketId of ticketIds) {
    try {
      const snap = await adminDb.collection("tickets").doc(ticketId).get();
      const ticket = snap.data();
      if (!ticket || ticket.status !== "sold") continue;
      if (ticket.ownershipTransfer?.status === "transferred") continue; // already done

      await transferTicketOwnership(
        ticketId,
        ticket,
        buyer,
        `TIKET-${paymentIntentId}-${ticketId}`
      );
    } catch (err) {
      console.error(`[venueTransfer] post-sale transfer error for ${ticketId}:`, err);
    }
  }
}
