// Tiket Connect Agent — internal lookup endpoint (Java example, JDK only).
//
// The only code you write: barcode in → ticket JSON out (404 if unknown).
// Bind to localhost / your private network only — the agent is the sole caller.
//
//   javac Lookup.java && java Lookup   →  http://127.0.0.1:8080/tiket/lookup?barcode=…

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

public class Lookup {

    /** Replace with your real query (JDBC/JPA); return null when unknown. */
    static String findTicketJson(String barcode) {
        // try (var stmt = conn.prepareStatement("SELECT * FROM tickets WHERE barcode = ?")) {
        //     stmt.setString(1, barcode);
        //     var rs = stmt.executeQuery();
        //     if (!rs.next()) return null;
        //     ... build the JSON below from the row ...
        // }
        if (!"1000000000001".equals(barcode)) return null;
        return """
            {"barcode":"1000000000001",
             "event_name":"עומר אדם — סיבוב קיץ",
             "venue":"היכל מנורה מבטחים",
             "date":"2030-08-15","time":"21:00",
             "section":"A","row":"12","seat":"7",
             "status":"active","original_price":350,
             "ticket_ref":"DEMO-1","barcode_format":"qr"}""";
    }

    public static void main(String[] args) throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 8080), 0);
        server.createContext("/tiket/lookup", exchange -> {
            String query = exchange.getRequestURI().getRawQuery();
            String barcode = "";
            if (query != null) {
                for (String pair : query.split("&")) {
                    if (pair.startsWith("barcode=")) {
                        barcode = URLDecoder.decode(pair.substring(8), StandardCharsets.UTF_8);
                    }
                }
            }
            String json = findTicketJson(barcode);
            byte[] body = (json != null ? json : "{\"error\":\"not_found\"}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(json != null ? 200 : 404, body.length);
            try (var out = exchange.getResponseBody()) {
                out.write(body);
            }
        });
        server.start();
        System.out.println("lookup endpoint on http://127.0.0.1:8080/tiket/lookup");
    }
}
