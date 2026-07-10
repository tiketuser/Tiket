package lookup

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	// Pure-Go drivers only — the agent stays a static, CGO-free binary.
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
	_ "github.com/microsoft/go-mssqldb"
)

// SQLLookup is the zero-code mode: instead of implementing an endpoint, the
// partner configures ONE read-only SELECT. Column names in the SELECT map
// directly to the protocol record fields (alias in SQL — no mapping config):
//
//	SELECT barcode, event_name, venue_name AS venue,
//	       event_date AS date, event_time AS time,
//	       section, row_num AS row, seat_num AS seat,
//	       status, face_value AS original_price, id AS ticket_ref
//	FROM tickets WHERE barcode = $1        -- postgres ($1) / mysql (?) / sqlserver (@p1)
//
// Hard requirements, enforced here and documented in SECURITY.md:
//   - the statement must be a single SELECT (guarded at startup);
//   - the DSN must use a read-only database user (the agent cannot enforce
//     this, but a partner security review can verify it in one query).
//
// Transfers in SQL mode are answered "not_supported" unless the partner also
// configures an HTTP transfer hook (transfer_url) — ownership transfer is a
// write and stays in the partner's own code by design.
type SQLLookup struct {
	db          *sql.DB
	query       string
	transferURL *HTTPLookup // optional write hook, reused from http mode
}

var sqlDrivers = map[string]string{
	"postgres":  "pgx",
	"pgx":       "pgx",
	"mysql":     "mysql",
	"mariadb":   "mysql",
	"sqlserver": "sqlserver",
	"mssql":     "sqlserver",
}

// NewSQLLookup validates the configuration and opens the pool (1-2 conns —
// the agent serves one verification at a time).
func NewSQLLookup(driver, dsn, query, transferURL string) (*SQLLookup, error) {
	driverName, ok := sqlDrivers[strings.ToLower(strings.TrimSpace(driver))]
	if !ok {
		return nil, fmt.Errorf("sql_driver must be postgres, mysql or sqlserver (got %q)", driver)
	}

	// SELECT-only guard: single statement, must start with SELECT or WITH.
	trimmed := strings.TrimSpace(query)
	upper := strings.ToUpper(trimmed)
	if !strings.HasPrefix(upper, "SELECT") && !strings.HasPrefix(upper, "WITH") {
		return nil, fmt.Errorf("sql_query must be a SELECT statement")
	}
	if strings.Contains(strings.TrimSuffix(trimmed, ";"), ";") {
		return nil, fmt.Errorf("sql_query must be a single statement")
	}
	for _, keyword := range []string{"INSERT ", "UPDATE ", "DELETE ", "DROP ", "ALTER ", "TRUNCATE ", "EXEC ", "MERGE "} {
		if strings.Contains(upper, keyword) {
			return nil, fmt.Errorf("sql_query contains a write keyword (%s) — reads only", strings.TrimSpace(keyword))
		}
	}

	db, err := sql.Open(driverName, dsn)
	if err != nil {
		return nil, fmt.Errorf("sql connection: %w", err)
	}
	db.SetMaxOpenConns(2)
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(30 * time.Minute)

	s := &SQLLookup{db: db, query: strings.TrimSuffix(trimmed, ";")}
	if transferURL != "" {
		s.transferURL = NewHTTPLookup("", transferURL)
	}
	return s, nil
}

// Ping verifies connectivity at startup.
func (s *SQLLookup) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

func (s *SQLLookup) Mode() string            { return "sql" }
func (s *SQLLookup) TransferSupported() bool { return s.transferURL != nil }

func (s *SQLLookup) Lookup(ctx context.Context, barcode string) (*Record, error) {
	rows, err := s.db.QueryContext(ctx, s.query, barcode)
	if err != nil {
		return nil, fmt.Errorf("sql lookup: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, rows.Err() // no row → unknown barcode
	}

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	values := make([]any, len(columns))
	ptrs := make([]any, len(columns))
	for i := range values {
		ptrs[i] = &values[i]
	}
	if err := rows.Scan(ptrs...); err != nil {
		return nil, fmt.Errorf("sql scan: %w", err)
	}

	record := &Record{}
	for i, col := range columns {
		assignColumn(record, strings.ToLower(strings.TrimSpace(col)), values[i])
	}
	if record.Barcode == "" {
		record.Barcode = barcode
	}
	return record, nil
}

func (s *SQLLookup) Transfer(ctx context.Context, req TransferRequest, record *Record) (*TransferOutcome, error) {
	if s.transferURL == nil {
		return nil, fmt.Errorf("transfer not configured")
	}
	return s.transferURL.Transfer(ctx, req, record)
}

func assignColumn(r *Record, column string, value any) {
	switch column {
	case "barcode":
		r.Barcode = sqlString(value)
	case "event_name", "eventname":
		r.EventName = sqlString(value)
	case "artist":
		r.Artist = sqlString(value)
	case "venue":
		r.Venue = sqlString(value)
	case "date", "event_date":
		r.Date = sqlDate(value)
	case "time", "event_time":
		r.Time = sqlTime(value)
	case "section":
		r.Section = sqlString(value)
	case "row":
		r.Row = sqlString(value)
	case "seat":
		r.Seat = sqlString(value)
	case "is_standing", "standing":
		r.IsStanding = sqlBool(value)
	case "status":
		r.Status = sqlString(value)
	case "original_price", "price":
		if f, ok := sqlFloat(value); ok {
			r.OriginalPrice = &f
		}
	case "currency":
		r.Currency = sqlString(value)
	case "ticket_ref", "id":
		r.TicketRef = sqlString(value)
	case "event_ref":
		r.EventRef = sqlString(value)
	case "barcode_format":
		r.BarcodeFormat = sqlString(value)
	}
}

func sqlString(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(t)
	case []byte:
		return strings.TrimSpace(string(t))
	case time.Time:
		return t.Format("2006-01-02")
	case int64:
		return strconv.FormatInt(t, 10)
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(t)
	default:
		return strings.TrimSpace(fmt.Sprintf("%v", t))
	}
}

func sqlDate(v any) string {
	if t, ok := v.(time.Time); ok {
		return t.Format("2006-01-02")
	}
	return sqlString(v)
}

func sqlTime(v any) string {
	if t, ok := v.(time.Time); ok {
		return t.Format("15:04")
	}
	return sqlString(v)
}

func sqlBool(v any) bool {
	switch t := v.(type) {
	case bool:
		return t
	case int64:
		return t != 0
	case []byte:
		s := strings.ToLower(strings.TrimSpace(string(t)))
		return s == "1" || s == "true" || s == "t" || s == "yes"
	case string:
		s := strings.ToLower(strings.TrimSpace(t))
		return s == "1" || s == "true" || s == "t" || s == "yes"
	default:
		return false
	}
}

func sqlFloat(v any) (float64, bool) {
	switch t := v.(type) {
	case float64:
		return t, true
	case int64:
		return float64(t), true
	case []byte:
		f, err := strconv.ParseFloat(strings.TrimSpace(string(t)), 64)
		return f, err == nil
	case string:
		f, err := strconv.ParseFloat(strings.TrimSpace(t), 64)
		return f, err == nil
	default:
		return 0, false
	}
}
