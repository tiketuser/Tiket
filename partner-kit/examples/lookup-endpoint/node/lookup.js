"use strict";

/**
 * Tiket Connect Agent — internal lookup endpoint (Node.js example).
 *
 * This is the ONLY code you write: barcode in → ticket JSON out (404 if
 * unknown). Keep it internal — never expose it to the internet; the agent
 * running next to it is the only caller.
 *
 *   node lookup.js          →  http://localhost:8080/tiket/lookup?barcode=…
 */

const http = require("http");

async function findTicket(barcode) {
  // Replace with your real query, e.g.:
  //   const row = await db.query("SELECT * FROM tickets WHERE barcode = ?", [barcode]);
  //   if (!row) return null;
  //   return { barcode: row.barcode, event_name: row.event_name, venue: row.venue_name,
  //            date: row.event_date, time: row.event_time, section: row.section,
  //            row: row.row_num, seat: row.seat_num, status: row.status,
  //            original_price: row.face_value, ticket_ref: row.id, barcode_format: "qr" };
  const demo = {
    "1000000000001": {
      barcode: "1000000000001",
      event_name: "עומר אדם — סיבוב קיץ",
      venue: "היכל מנורה מבטחים",
      date: "2030-08-15",
      time: "21:00",
      section: "A", row: "12", seat: "7",
      status: "active",
      original_price: 350,
      ticket_ref: "DEMO-1",
      barcode_format: "qr",
    },
  };
  return demo[barcode] || null;
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/tiket/lookup") {
      res.writeHead(404).end();
      return;
    }
    const ticket = await findTicket(url.searchParams.get("barcode") || "");
    res.writeHead(ticket ? 200 : 404, { "Content-Type": "application/json" });
    res.end(ticket ? JSON.stringify(ticket) : JSON.stringify({ error: "not_found" }));
  })
  .listen(process.env.PORT || 8080, "127.0.0.1", () =>
    console.log("lookup endpoint on http://127.0.0.1:8080/tiket/lookup")
  );
