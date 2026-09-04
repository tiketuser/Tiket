package protocol

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/tiket-il/tiket-connect-agent/internal/compare"
	"github.com/tiket-il/tiket-connect-agent/internal/lookup"
)

// APIVersion is the Tiket Connect protocol version this agent speaks.
const APIVersion = "1"

const (
	transferCacheTTL = 24 * time.Hour
	transferCacheMax = 5000
)

// Handler turns authenticated protocol envelopes into protocol responses.
// It is transport-agnostic: the relay client (or the selftest) feeds it
// already-authenticated raw bodies.
type Handler struct {
	Lookup lookup.TicketLookup

	mu            sync.Mutex
	transferCache map[string]cachedTransfer
	cacheOrder    []string
}

type cachedTransfer struct {
	at   time.Time
	code int
	body []byte
}

// Reply is an HTTP-shaped answer for the relay to forward.
type Reply struct {
	Status int
	Body   []byte
}

func jsonReply(status int, payload any) Reply {
	body, err := json.Marshal(payload)
	if err != nil {
		return Reply{Status: 500, Body: []byte(`{"error":"internal_error"}`)}
	}
	return Reply{Status: status, Body: body}
}

func errorReply(status int, code string) Reply {
	return jsonReply(status, map[string]string{"error": code})
}

// flexString tolerates JSON strings and numbers (section: 5 vs "5").
func flexString(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return t
	case float64:
		if t == float64(int64(t)) {
			return fmt.Sprintf("%d", int64(t))
		}
		return fmt.Sprintf("%v", t)
	case bool:
		if t {
			return "true"
		}
		return "false"
	default:
		return fmt.Sprintf("%v", t)
	}
}

func claimToTicket(claim map[string]any) compare.Ticket {
	isStanding, _ := claim["is_standing"].(bool)
	return compare.Ticket{
		Barcode:    flexString(claim["barcode"]),
		EventName:  flexString(claim["event_name"]),
		Artist:     flexString(claim["artist"]),
		Venue:      flexString(claim["venue"]),
		Date:       flexString(claim["date"]),
		Time:       flexString(claim["time"]),
		Section:    flexString(claim["section"]),
		Row:        flexString(claim["row"]),
		Seat:       flexString(claim["seat"]),
		IsStanding: isStanding,
	}
}

func recordToTicket(r *lookup.Record) compare.Ticket {
	return compare.Ticket{
		Barcode:    r.Barcode,
		EventName:  r.EventName,
		Artist:     r.Artist,
		Venue:      r.Venue,
		Date:       r.Date,
		Time:       r.Time,
		Section:    r.Section,
		Row:        r.Row,
		Seat:       r.Seat,
		IsStanding: r.IsStanding,
	}
}

// HandleVerify processes a /tiket/verify body (already authenticated).
func (h *Handler) HandleVerify(ctx context.Context, rawBody []byte) Reply {
	var payload struct {
		RequestID string         `json:"request_id"`
		Ticket    map[string]any `json:"ticket"`
	}
	if err := json.Unmarshal(rawBody, &payload); err != nil || payload.Ticket == nil {
		return errorReply(400, "invalid_json")
	}
	claim := claimToTicket(payload.Ticket)
	if claim.Barcode == "" {
		return errorReply(400, "missing_ticket_barcode")
	}

	record, err := h.Lookup.Lookup(ctx, claim.Barcode)
	if err != nil {
		log.Printf("[tiket-agent] lookup failed: %v", err)
		return errorReply(500, "lookup_failed")
	}

	base := map[string]any{"api_version": APIVersion, "request_id": payload.RequestID}

	if record == nil {
		base["result"] = "not_found"
		base["confidence"] = 0
		base["matched_fields"] = []string{}
		base["unmatched_fields"] = []string{}
		return jsonReply(200, base)
	}

	res := compare.Compare(claim, recordToTicket(record))
	status := record.Status
	if status == "" {
		status = "active"
	}
	isMatch := res.Confidence >= compare.MatchThreshold && !res.CriticalFailed

	base["result"] = map[bool]string{true: "match", false: "mismatch"}[isMatch]
	base["confidence"] = res.Confidence
	base["matched_fields"] = res.Matched
	base["unmatched_fields"] = res.Unmatched
	base["ticket_status"] = status
	if record.TicketRef != "" {
		base["ticket_ref"] = record.TicketRef
	}
	if record.EventRef != "" {
		base["event_ref"] = record.EventRef
	}
	if record.OriginalPrice != nil {
		base["original_price"] = *record.OriginalPrice
		currency := record.Currency
		if currency == "" {
			currency = "ILS"
		}
		base["currency"] = currency
	}
	return jsonReply(200, base)
}

// HandleTransfer processes a /tiket/transfer body (already authenticated),
// with in-memory idempotency on transfer_ref. Durable idempotency across
// agent restarts remains the partner's responsibility.
func (h *Handler) HandleTransfer(ctx context.Context, rawBody []byte) Reply {
	var payload struct {
		RequestID string                 `json:"request_id"`
		Transfer  lookup.TransferRequest `json:"transfer"`
	}
	if err := json.Unmarshal(rawBody, &payload); err != nil {
		return errorReply(400, "invalid_json")
	}
	t := payload.Transfer
	if t.Barcode == "" || t.TransferRef == "" {
		return errorReply(400, "missing_transfer_fields")
	}
	if t.NewHolder.Email == "" && t.NewHolder.Phone == "" {
		return errorReply(400, "missing_new_holder_contact")
	}

	base := map[string]any{
		"api_version": APIVersion,
		"request_id":  payload.RequestID,
		"transfer_ref": t.TransferRef,
	}

	if cached, ok := h.cachedTransfer(t.TransferRef); ok {
		return Reply{Status: cached.code, Body: cached.body}
	}

	if !h.Lookup.TransferSupported() {
		base["result"] = "not_supported"
		return jsonReply(200, base)
	}

	record, err := h.Lookup.Lookup(ctx, t.Barcode)
	if err != nil {
		log.Printf("[tiket-agent] lookup failed during transfer: %v", err)
		return errorReply(500, "lookup_failed")
	}
	if record == nil {
		base["result"] = "not_found"
		return jsonReply(200, base)
	}

	status := record.Status
	if status == "" {
		status = "active"
	}
	if status != "active" {
		base["result"] = "rejected"
		base["reason"] = "ticket_not_active:" + status
		return h.remember(t.TransferRef, jsonReply(200, base))
	}

	outcome, err := h.Lookup.Transfer(ctx, t, record)
	if err != nil {
		log.Printf("[tiket-agent] transfer failed: %v", err)
		return errorReply(500, "transfer_failed")
	}
	if outcome == nil || !outcome.OK {
		base["result"] = "rejected"
		base["reason"] = "rejected_by_provider"
		if outcome != nil && outcome.Reason != "" {
			base["reason"] = outcome.Reason
		}
		return h.remember(t.TransferRef, jsonReply(200, base))
	}

	base["result"] = "transferred"
	base["old_barcode_invalidated"] = true
	delivery := outcome.Delivery
	if delivery == "" {
		if outcome.NewBarcode != "" {
			delivery = "new_barcode"
		} else {
			delivery = "provider"
		}
	}
	base["delivery"] = delivery
	if outcome.NewBarcode != "" {
		base["new_barcode"] = outcome.NewBarcode
		format := outcome.BarcodeFormat
		if format == "" {
			format = record.BarcodeFormat
		}
		if format != "" {
			base["barcode_format"] = format
		}
	}
	if outcome.NewTicketRef != "" {
		base["new_ticket_ref"] = outcome.NewTicketRef
	}
	return h.remember(t.TransferRef, jsonReply(200, base))
}

func (h *Handler) cachedTransfer(ref string) (cachedTransfer, bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	cached, ok := h.transferCache[ref]
	if !ok || time.Since(cached.at) > transferCacheTTL {
		return cachedTransfer{}, false
	}
	return cached, true
}

func (h *Handler) remember(ref string, reply Reply) Reply {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.transferCache == nil {
		h.transferCache = map[string]cachedTransfer{}
	}
	if len(h.cacheOrder) >= transferCacheMax {
		oldest := h.cacheOrder[0]
		h.cacheOrder = h.cacheOrder[1:]
		delete(h.transferCache, oldest)
	}
	h.transferCache[ref] = cachedTransfer{at: time.Now(), code: reply.Status, body: reply.Body}
	h.cacheOrder = append(h.cacheOrder, ref)
	return reply
}
