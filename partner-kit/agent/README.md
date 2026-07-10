# Tiket Connect Agent

A small program you run **inside your own network** so TIKET can verify resale
tickets against your records — with **zero inbound exposure**. The agent only
ever dials *out* to TIKET over HTTPS (like a browser). You open no firewall
ports, need no public URL, no DNS entry, no TLS certificate, and nothing on
your side is reachable from the internet.

```
YOUR NETWORK                                  TIKET
┌─────────────────────────────────┐
│ your ticket DB                  │
│   ▲                             │
│ your internal lookup endpoint   │   outbound HTTPS only
│   ▲                             │  ───────────────────►  relay
│ tiket-agent  ───────────────────┼──────────────────────►
└─────────────────────────────────┘
   verdicts only cross the wire — customer data never leaves your network
```

Every request the agent receives is HMAC-SHA256-signed by TIKET and verified
**inside the agent** with a secret only you and TIKET hold — the transport in
between is untrusted by design. See `../SECURITY.md` for the full threat model.

## Quick start (10 minutes)

1. **Implement your lookup endpoint** (~20 lines, any language — copy one from
   [`../examples/lookup-endpoint/`](../examples/lookup-endpoint/)): an
   internal-only HTTP route that takes `?barcode=…` and returns the ticket as
   JSON (or 404). This is the only code you write.

2. **Configure**: copy `config.example.conf` to `tiket-agent.conf`, paste the
   shared secret TIKET sent you, point `lookup_url` at your endpoint.

3. **Enroll** (once) with the one-time pairing token from TIKET:

   ```
   tiket-agent enroll --token <pairing token>
   ```

4. **Run**:

   ```
   tiket-agent run
   ```

   TIKET's admin panel shows your agent online within seconds. Done.

Verify a build anytime without TIKET's involvement:

```
tiket-agent selftest
```

## Running as a service

**Linux (systemd)** — `/etc/systemd/system/tiket-agent.service`:

```ini
[Unit]
Description=Tiket Connect Agent
After=network-online.target

[Service]
ExecStart=/usr/local/bin/tiket-agent run --config /etc/tiket/tiket-agent.conf
WorkingDirectory=/var/lib/tiket
User=tiket
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Windows** (as a service via [NSSM](https://nssm.cc) or `sc create`):

```
nssm install TiketAgent C:\tiket\tiket-agent.exe run --config C:\tiket\tiket-agent.conf
nssm start TiketAgent
```

**Docker**: see the `Dockerfile` header. The container exposes no ports.

## Configuration

`tiket-agent.conf` is a plain `key = value` file (see `config.example.conf`).
Every key has an environment-variable override:

| Config key | Env var | Meaning |
| --- | --- | --- |
| `relay_url` | `TIKET_RELAY_URL` | TIKET's base URL |
| `secret` / `secret.<keyId>` | `TIKET_CONNECT_SECRET` / `TIKET_CONNECT_SECRETS` (`id:secret,id:secret`) | HMAC shared secret(s) |
| `credentials_file` | `TIKET_CREDENTIALS_FILE` | Where the enrollment identity lives |
| `lookup_mode` | `TIKET_LOOKUP_MODE` | `http` or `sql` |
| `lookup_url` | `TIKET_LOOKUP_URL` | Your internal barcode-lookup endpoint (http mode) |
| `transfer_url` | `TIKET_TRANSFER_URL` | Optional ownership-transfer hook (both modes) |
| `sql_driver` / `sql_dsn` / `sql_query` | `TIKET_SQL_*` | Zero-code mode: one read-only SELECT |

### Zero-code SQL mode

If you'd rather write **no code at all**, point the agent at your database
with a read-only user and one SELECT. Column names (alias in SQL) map straight
to the protocol fields:

```
lookup_mode = sql
sql_driver  = sqlserver          # or postgres / mysql
sql_dsn     = sqlserver://tiket_readonly:***@dbhost?database=tickets
sql_query   = SELECT barcode, event_name, venue_name AS venue,
                     event_date AS date, event_time AS time,
                     section, row_num AS row, seat_num AS seat,
                     status, face_value AS original_price, id AS ticket_ref
              FROM tickets WHERE barcode = @p1
```

(placeholder: `@p1` for SQL Server, `$1` for Postgres, `?` for MySQL)

The agent refuses anything that isn't a single SELECT, and **must** be given a
read-only database user — that's your guarantee (verifiable in one query by
your DBA) that TIKET's software cannot touch your data. Ownership transfer is
a write, so in SQL mode it stays `not_supported` unless you also implement the
small HTTP `transfer_url` hook.

## What the agent answers

- **Verify**: compares TIKET's claimed ticket against your record *locally*
  and answers `match / mismatch / not_found` + field names + confidence.
  No customer PII in either direction.
- **Transfer** (optional): when a ticket is resold on TIKET, invalidate the
  seller's barcode and issue the ticket to the buyer. Configure `transfer_url`
  to enable; otherwise the agent answers `not_supported` and TIKET falls back
  to manual handover. Make your implementation idempotent on `transfer_ref` —
  the agent absorbs quick retries in memory, but durable replay protection
  across restarts belongs in your database (one small table).

## Building from source

Go ≥ 1.25. The protocol, crypto and relay code use only the Go standard
library; the sole third-party code is the pure-Go SQL drivers for the
zero-code mode (pgx / go-sql-driver / go-mssqldb) — a dependency tree your
security team can audit in an afternoon.

```
make build      # bin/tiket-agent for this machine
make release    # linux/windows/darwin matrix + SHA256SUMS
make selftest   # 12 checks incl. the shared protocol vectors
```
