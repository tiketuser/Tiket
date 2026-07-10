"use strict";

/**
 * Tiket Connect — standalone server example.
 *
 * Replace the demo lookupTicket with a query against your real database,
 * set TIKET_CONNECT_SECRET, and run:
 *
 *   TIKET_CONNECT_SECRET="the-shared-secret" node example-standalone.js
 *
 * Then verify locally:
 *   curl http://localhost:8477/tiket/health
 */

const { createTiketConnect } = require("./tiket-connect");

const connect = createTiketConnect({
  secret: process.env.TIKET_CONNECT_SECRET,

  // ── The ONLY thing you implement ──
  // Look the barcode up in YOUR system. Return null when unknown.
  lookupTicket: async (barcode) => {
    // Example with SQL (mssql / mysql2 / pg — whatever you already use):
    //
    //   const row = await db.query(
    //     "SELECT * FROM tickets WHERE barcode = @barcode", { barcode }
    //   );
    //   if (!row) return null;
    //   return {
    //     barcode:        row.barcode,
    //     event_name:     row.event_name,
    //     venue:          row.venue_name,
    //     date:           row.event_date,          // Date or "YYYY-MM-DD"
    //     time:           row.event_time,          // "HH:MM"
    //     section:        row.section,
    //     row:            row.row_number,
    //     seat:           row.seat_number,
    //     is_standing:    !row.seat_number,
    //     status:         row.status,              // "active" unless cancelled/used/refunded
    //     original_price: row.face_value_ils,
    //     ticket_ref:     row.id,
    //   };

    // Demo data so the example runs out of the box:
    if (barcode === "1234567890123") {
      return {
        barcode,
        event_name: "הופעת הדגמה",
        venue: "אולם הדגמה",
        date: "2030-01-01",
        time: "21:00",
        is_standing: true,
        status: "active",
        original_price: 200,
        ticket_ref: "DEMO-1",
      };
    }
    return null;
  },

  // ── Optional but recommended: ownership transfer ──
  // When a ticket sells on TIKET, invalidate the old barcode and issue the
  // ticket to the buyer. Make it durably idempotent on transfer_ref!
  // See INTEGRATION_GUIDE.md §4. Delete this stub to answer "not_supported".
  //
  // transferTicket: async (transfer, record) => {
  //   const existing = await db.query(
  //     "SELECT new_barcode FROM ticket_transfers WHERE transfer_ref = @ref",
  //     { ref: transfer.transfer_ref });
  //   if (existing) return { ok: true, new_barcode: existing.new_barcode, delivery: "new_barcode" };
  //
  //   const newBarcode = await reissueTicket(record.ticket_ref, transfer.new_holder);
  //   await db.query("INSERT INTO ticket_transfers (transfer_ref, new_barcode) VALUES (@ref, @nb)",
  //     { ref: transfer.transfer_ref, nb: newBarcode });
  //   return { ok: true, new_barcode: newBarcode, delivery: "new_barcode" };
  // },
});

connect.listen(process.env.PORT || 8477);
