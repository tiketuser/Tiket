<?php
/**
 * Tiket Connect Agent — internal lookup endpoint (PHP example).
 *
 * The only code you write: barcode in → ticket JSON out (404 if unknown).
 * Serve it INTERNALLY only (the agent is the sole caller):
 *
 *   php -S 127.0.0.1:8080 lookup.php
 *
 * Then in tiket-agent.conf:  lookup_url = http://127.0.0.1:8080/tiket/lookup
 */

if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) !== '/tiket/lookup') {
    http_response_code(404);
    exit;
}

function find_ticket(string $barcode): ?array {
    // Replace with your real query, e.g.:
    //   $stmt = $pdo->prepare('SELECT * FROM tickets WHERE barcode = ?');
    //   $stmt->execute([$barcode]);
    //   $row = $stmt->fetch(PDO::FETCH_ASSOC);
    //   if (!$row) return null;
    //   return [
    //     'barcode'        => $row['barcode'],
    //     'event_name'     => $row['event_name'],
    //     'venue'          => $row['venue_name'],
    //     'date'           => $row['event_date'],   // YYYY-MM-DD
    //     'time'           => $row['event_time'],   // HH:MM
    //     'section'        => $row['section'],
    //     'row'            => $row['row_num'],
    //     'seat'           => $row['seat_num'],
    //     'status'         => $row['status'],       // active|used|cancelled|refunded|transferred
    //     'original_price' => (float)$row['face_value'],
    //     'ticket_ref'     => $row['id'],
    //     'barcode_format' => 'qr',                 // what your gate scanners read
    //   ];
    $demo = [
        '1000000000001' => [
            'barcode' => '1000000000001',
            'event_name' => 'עומר אדם — סיבוב קיץ',
            'venue' => 'היכל מנורה מבטחים',
            'date' => '2030-08-15', 'time' => '21:00',
            'section' => 'A', 'row' => '12', 'seat' => '7',
            'status' => 'active', 'original_price' => 350,
            'ticket_ref' => 'DEMO-1', 'barcode_format' => 'qr',
        ],
    ];
    return $demo[$barcode] ?? null;
}

$ticket = find_ticket($_GET['barcode'] ?? '');
header('Content-Type: application/json; charset=utf-8');
if ($ticket === null) {
    http_response_code(404);
    echo json_encode(['error' => 'not_found']);
} else {
    echo json_encode($ticket, JSON_UNESCAPED_UNICODE);
}
