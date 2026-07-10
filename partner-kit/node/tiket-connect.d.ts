/**
 * Tiket Connect — partner-side verification adapter (type definitions).
 * See tiket-connect.js and INTEGRATION_GUIDE.md.
 */

import type { IncomingMessage, ServerResponse, Server } from "http";

/** The claimed ticket details TIKET sends for verification. */
export interface TiketClaim {
  barcode: string;
  event_name?: string;
  artist?: string;
  venue?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  section?: string;
  row?: string;
  seat?: string;
  is_standing?: boolean;
}

/** The record your lookupTicket returns from your own database. */
export interface PartnerTicketRecord {
  barcode?: string;
  event_name?: string;
  artist?: string;
  venue?: string;
  date?: string | Date; // "YYYY-MM-DD", "DD/MM/YYYY", ISO datetime or Date
  time?: string; // "HH:MM" (seconds tolerated)
  section?: string | number;
  row?: string | number;
  seat?: string | number;
  is_standing?: boolean;
  /** "active" | "used" | "cancelled" | "refunded" | "transferred" — default "active" */
  status?: string;
  original_price?: number;
  currency?: string; // default "ILS"
  ticket_ref?: string | number;
  event_ref?: string | number;
  /** Symbology your gate scanners read: "qr" | "code128" | "pdf417" | "aztec" | "ean13" */
  barcode_format?: string;
}

/** Ownership-transfer request TIKET sends when a ticket is resold. */
export interface TiketTransferRequest {
  barcode: string;
  ticket_ref?: string;
  /** Idempotency key — a repeated transfer_ref must not transfer twice. */
  transfer_ref: string;
  new_holder: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export type TiketTransferOutcome =
  | {
      ok: true;
      /** The re-issued barcode, when you deliver it back through TIKET. */
      new_barcode?: string;
      /**
       * Symbology of new_barcode ("qr" | "code128" | "pdf417" | "aztec" |
       * "ean13") — tells TIKET how to render it so your gate scanners read it.
       * Defaults to the record's barcode_format when omitted.
       */
      barcode_format?: string;
      new_ticket_ref?: string;
      /** How the buyer receives the ticket: "new_barcode" | "email" | "app" | "provider" */
      delivery?: string;
    }
  | { ok: false; reason?: string };

export interface TiketConnectOptions {
  /** Shared secret from TIKET. 16+ chars required, 32+ recommended. */
  secret?: string;
  /**
   * Key-rotation form: { keyId: secret, ... }. TIKET sends X-Tiket-Key-Id to
   * select the secret; configure old + new during a rotation, then drop the
   * old. At least one of secret / secrets is required.
   */
  secrets?: Record<string, string>;
  /** Look a ticket up in YOUR system by barcode. Return null if unknown. */
  lookupTicket: (
    barcode: string,
    claim: TiketClaim | null
  ) => Promise<PartnerTicketRecord | null> | PartnerTicketRecord | null;
  /**
   * Optional: invalidate the old barcode and issue the ticket to the buyer.
   * Called only for tickets that exist and are active; make it durable-
   * idempotent on transfer_ref. Omit to answer transfers "not_supported".
   */
  transferTicket?: (
    transfer: TiketTransferRequest,
    record: PartnerTicketRecord
  ) => Promise<TiketTransferOutcome> | TiketTransferOutcome;
  /** Route prefix. Default: "/tiket" */
  basePath?: string;
  /** Allowed signature timestamp skew in seconds. Default: 300 */
  toleranceSeconds?: number;
  /** console-like logger, or null to silence. */
  logger?: Pick<Console, "info" | "warn" | "error"> | null;
}

export interface TiketConnect {
  /** Raw Node handler. Returns true when the request was a Tiket route and was handled. */
  handler: (req: IncomingMessage, res: ServerResponse) => boolean;
  /** Express/Connect middleware — mount BEFORE body parsers. */
  middleware: (req: IncomingMessage, res: ServerResponse, next?: () => void) => void;
  /** Start a dedicated HTTP server. */
  listen: (port: number, callback?: (server: Server) => void) => Server;
}

export declare function createTiketConnect(options: TiketConnectOptions): TiketConnect;
export declare function computeSignature(secret: string, timestamp: string | number, rawBody: string): string;
export declare function compareClaimToRecord(
  claim: TiketClaim,
  record: PartnerTicketRecord
): { confidence: number; matched: string[]; unmatched: string[]; criticalFailed: boolean };
export declare const KIT_VERSION: string;
export declare const API_VERSION: string;
/** Exposed for the shared spec test vectors (spec/test-vectors.json). */
export declare const normalizers: {
  normText: (value: unknown) => string;
  normDate: (value: unknown) => string;
  normTime: (value: unknown) => string;
  normSeatPart: (value: unknown) => string;
};
