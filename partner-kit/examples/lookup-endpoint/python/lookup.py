"""Tiket Connect Agent — internal lookup endpoint (Python example, stdlib only).

The only code you write: barcode in -> ticket JSON out (404 if unknown).
Serve it INTERNALLY only (the agent is the sole caller):

    python3 lookup.py       ->  http://127.0.0.1:8080/tiket/lookup?barcode=...
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

DEMO = {
    "1000000000001": {
        "barcode": "1000000000001",
        "event_name": "עומר אדם — סיבוב קיץ",
        "venue": "היכל מנורה מבטחים",
        "date": "2030-08-15",
        "time": "21:00",
        "section": "A", "row": "12", "seat": "7",
        "status": "active",
        "original_price": 350,
        "ticket_ref": "DEMO-1",
        "barcode_format": "qr",
    },
}


def find_ticket(barcode: str):
    # Replace with your real query, e.g.:
    #   row = db.execute("SELECT * FROM tickets WHERE barcode = %s", (barcode,)).fetchone()
    #   if not row: return None
    #   return {"barcode": row.barcode, "event_name": row.event_name,
    #           "venue": row.venue_name, "date": str(row.event_date),
    #           "time": row.event_time, "section": row.section,
    #           "row": row.row_num, "seat": row.seat_num, "status": row.status,
    #           "original_price": float(row.face_value), "ticket_ref": row.id,
    #           "barcode_format": "qr"}
    return DEMO.get(barcode)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path != "/tiket/lookup":
            self.send_error(404)
            return
        barcode = parse_qs(url.query).get("barcode", [""])[0]
        ticket = find_ticket(barcode)
        body = json.dumps(ticket or {"error": "not_found"}, ensure_ascii=False).encode()
        self.send_response(200 if ticket else 404)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # quiet
        pass


if __name__ == "__main__":
    print("lookup endpoint on http://127.0.0.1:8080/tiket/lookup")
    HTTPServer(("127.0.0.1", 8080), Handler).serve_forever()
