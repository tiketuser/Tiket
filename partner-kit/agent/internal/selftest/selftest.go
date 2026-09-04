// Package selftest validates an agent build with no TIKET involvement:
// the shared protocol vectors (partner-kit/spec/test-vectors.json) plus a
// live in-process loop over the verify/transfer handlers.
package selftest

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"time"

	"github.com/tiket-il/tiket-connect-agent/internal/compare"
	"github.com/tiket-il/tiket-connect-agent/internal/lookup"
	"github.com/tiket-il/tiket-connect-agent/internal/protocol"
)

type vectors struct {
	MatchThreshold int `json:"match_threshold"`
	Signature      []struct {
		Name              string `json:"name"`
		KeyID             string `json:"key_id"`
		Secret            string `json:"secret"`
		Timestamp         string `json:"timestamp"`
		Body              string `json:"body"`
		ExpectedSignature string `json:"expected_signature"`
	} `json:"signature"`
	Normalization []struct {
		Fn       string `json:"fn"`
		Input    string `json:"input"`
		Expected string `json:"expected"`
	} `json:"normalization"`
	Comparison []struct {
		Name     string         `json:"name"`
		Claim    map[string]any `json:"claim"`
		Record   map[string]any `json:"record"`
		Expected struct {
			Confidence      int      `json:"confidence"`
			MatchedFields   []string `json:"matched_fields"`
			UnmatchedFields []string `json:"unmatched_fields"`
			CriticalFailed  bool     `json:"critical_failed"`
			Result          string   `json:"result"`
		} `json:"expected"`
	} `json:"comparison"`
}

func flexString(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return t
	case float64:
		if t == float64(int64(t)) {
			return strconv.FormatInt(int64(t), 10)
		}
		return strconv.FormatFloat(t, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(t)
	default:
		return fmt.Sprintf("%v", t)
	}
}

func mapToTicket(m map[string]any) compare.Ticket {
	standing, _ := m["is_standing"].(bool)
	return compare.Ticket{
		Barcode:    flexString(m["barcode"]),
		EventName:  flexString(m["event_name"]),
		Artist:     flexString(m["artist"]),
		Venue:      flexString(m["venue"]),
		Date:       flexString(m["date"]),
		Time:       flexString(m["time"]),
		Section:    flexString(m["section"]),
		Row:        flexString(m["row"]),
		Seat:       flexString(m["seat"]),
		IsStanding: standing,
	}
}

// demoLookup is the in-process fake partner for the live-loop checks.
type demoLookup struct {
	tickets       map[string]*lookup.Record
	transferCalls int
	noTransfer    bool
}

func (d *demoLookup) Mode() string            { return "demo" }
func (d *demoLookup) TransferSupported() bool { return !d.noTransfer }
func (d *demoLookup) Lookup(_ context.Context, barcode string) (*lookup.Record, error) {
	return d.tickets[barcode], nil
}
func (d *demoLookup) Transfer(_ context.Context, tr lookup.TransferRequest, _ *lookup.Record) (*lookup.TransferOutcome, error) {
	d.transferCalls++
	return &lookup.TransferOutcome{
		OK:            true,
		NewBarcode:    "REISSUED-" + tr.TransferRef,
		BarcodeFormat: "qr",
		Delivery:      "new_barcode",
	}, nil
}

// Run executes the suite; returns the number of failures.
func Run(vectorsPath string) int {
	failures := 0
	passed := 0
	check := func(name string, ok bool, detail string) {
		if ok {
			passed++
			fmt.Printf("  ✓ %s\n", name)
		} else {
			failures++
			fmt.Printf("  ✗ %s\n    %s\n", name, detail)
		}
	}

	fmt.Printf("tiket-agent self-test (protocol v%s)\n\n", protocol.APIVersion)

	// ── Shared spec vectors ──
	data, err := os.ReadFile(vectorsPath)
	if err != nil {
		fmt.Printf("  ✗ cannot read vectors file %s: %v\n", vectorsPath, err)
		return 1
	}
	var v vectors
	if err := json.Unmarshal(data, &v); err != nil {
		fmt.Printf("  ✗ vectors file is invalid JSON: %v\n", err)
		return 1
	}

	sigOK, sigDetail := true, ""
	for _, s := range v.Signature {
		got := protocol.ComputeSignature(s.Secret, s.Timestamp, []byte(s.Body))
		if got != s.ExpectedSignature {
			sigOK = false
			sigDetail = fmt.Sprintf("%s/%s: got %s want %s", s.KeyID, s.Name, got, s.ExpectedSignature)
			break
		}
	}
	check("spec signature vectors", sigOK, sigDetail)

	normOK, normDetail := true, ""
	impls := map[string]func(string) string{
		"date": compare.NormDate,
		"time": compare.NormTime,
		"text": compare.NormText,
		"seat": compare.NormSeatPart,
	}
	for _, n := range v.Normalization {
		if got := impls[n.Fn](n.Input); got != n.Expected {
			normOK = false
			normDetail = fmt.Sprintf("%s(%q): got %q want %q", n.Fn, n.Input, got, n.Expected)
			break
		}
	}
	check("spec normalization vectors", normOK, normDetail)

	cmpOK, cmpDetail := true, ""
	for _, c := range v.Comparison {
		r := compare.Compare(mapToTicket(c.Claim), mapToTicket(c.Record))
		result := "mismatch"
		if r.Confidence >= v.MatchThreshold && !r.CriticalFailed {
			result = "match"
		}
		if r.Confidence != c.Expected.Confidence ||
			!reflect.DeepEqual(r.Matched, c.Expected.MatchedFields) ||
			!reflect.DeepEqual(r.Unmatched, c.Expected.UnmatchedFields) ||
			r.CriticalFailed != c.Expected.CriticalFailed ||
			result != c.Expected.Result {
			cmpOK = false
			cmpDetail = fmt.Sprintf("%q: got conf=%d matched=%v unmatched=%v crit=%v result=%s; want conf=%d matched=%v unmatched=%v crit=%v result=%s",
				c.Name, r.Confidence, r.Matched, r.Unmatched, r.CriticalFailed, result,
				c.Expected.Confidence, c.Expected.MatchedFields, c.Expected.UnmatchedFields, c.Expected.CriticalFailed, c.Expected.Result)
			break
		}
	}
	check(fmt.Sprintf("spec comparison vectors (%d cases)", len(v.Comparison)), cmpOK, cmpDetail)

	// ── Live handler loop (authenticated envelopes, end to end) ──
	price := 350.0
	demo := &demoLookup{tickets: map[string]*lookup.Record{
		"1000000000001": {
			Barcode: "1000000000001", EventName: "עומר אדם — סיבוב קיץ", Venue: "היכל מנורה מבטחים",
			Date: "2030-08-15", Time: "21:00", Section: "A", Row: "12", Seat: "7",
			Status: "active", OriginalPrice: &price, TicketRef: "DEMO-1",
		},
		"1000000000003": {
			Barcode: "1000000000003", EventName: "הופעה שבוטלה", Venue: "היכל התרבות",
			Date: "2030-10-10", IsStanding: true, Status: "cancelled",
		},
	}}
	handler := &protocol.Handler{Lookup: demo}
	secrets := map[string]string{"k_test": "selftest-secret-0123456789abcdef"}
	ctx := context.Background()

	signedBody := func(payload any) ([]byte, string, string) {
		body, _ := json.Marshal(payload)
		ts := strconv.FormatInt(time.Now().Unix(), 10)
		return body, ts, protocol.ComputeSignature(secrets["k_test"], ts, body)
	}
	authOK := func(body []byte, ts, sig, keyID string) error {
		return protocol.Authenticate(secrets, keyID, ts, sig, body, 300)
	}

	verifyClaim := map[string]any{
		"barcode": "1000000000001", "event_name": "עומר אדם — סיבוב קיץ", "artist": "עומר אדם",
		"venue": "היכל מנורה", "date": "2030-08-15", "time": "21:00",
		"section": "A", "row": "012", "seat": "07", "is_standing": false,
	}

	{
		body, ts, sig := signedBody(map[string]any{"api_version": "1", "request_id": "st-1", "ticket": verifyClaim})
		err := authOK(body, ts, sig, "k_test")
		reply := handler.HandleVerify(ctx, body)
		var out map[string]any
		json.Unmarshal(reply.Body, &out)
		check("signed verify → match (fuzzy seats + venue)",
			err == nil && reply.Status == 200 && out["result"] == "match" && out["original_price"] == 350.0,
			fmt.Sprintf("auth=%v status=%d body=%s", err, reply.Status, reply.Body))
	}

	{
		body, ts, _ := signedBody(map[string]any{"api_version": "1", "ticket": verifyClaim})
		err := authOK(body, ts, "deadbeef", "k_test")
		check("bad signature rejected", err != nil, "expected auth error")
	}

	{
		body, _, _ := signedBody(map[string]any{"api_version": "1", "ticket": verifyClaim})
		staleTs := strconv.FormatInt(time.Now().Unix()-3600, 10)
		sig := protocol.ComputeSignature(secrets["k_test"], staleTs, body)
		err := authOK(body, staleTs, sig, "k_test")
		check("stale timestamp rejected", err != nil, "expected replay-window error")
	}

	{
		body, ts, sig := signedBody(map[string]any{"api_version": "1", "ticket": verifyClaim})
		err := authOK(body, ts, sig, "") // no key-id header → try all secrets
		check("missing key-id falls back to all secrets", err == nil, fmt.Sprintf("%v", err))
	}

	{
		unknown := map[string]any{}
		for k, v := range verifyClaim {
			unknown[k] = v
		}
		unknown["barcode"] = "9999999999999"
		body, _, _ := signedBody(map[string]any{"api_version": "1", "ticket": unknown})
		reply := handler.HandleVerify(ctx, body)
		var out map[string]any
		json.Unmarshal(reply.Body, &out)
		check("unknown barcode → not_found", out["result"] == "not_found", string(reply.Body))
	}

	transferPayload := func(ref, barcode string) []byte {
		body, _ := json.Marshal(map[string]any{
			"api_version": "1", "request_id": "st-t",
			"transfer": map[string]any{
				"barcode": barcode, "transfer_ref": ref,
				"new_holder": map[string]string{"first_name": "דנה", "last_name": "כהן", "email": "buyer@example.com", "phone": "0501234567"},
			},
		})
		return body
	}

	{
		reply := handler.HandleTransfer(ctx, transferPayload("TIKET-TX-1", "1000000000001"))
		var out map[string]any
		json.Unmarshal(reply.Body, &out)
		check("transfer → transferred with barcode_format",
			out["result"] == "transferred" && out["new_barcode"] == "REISSUED-TIKET-TX-1" && out["barcode_format"] == "qr",
			string(reply.Body))
	}

	{
		reply := handler.HandleTransfer(ctx, transferPayload("TIKET-TX-1", "1000000000001"))
		var out map[string]any
		json.Unmarshal(reply.Body, &out)
		check("replayed transfer_ref → idempotent (1 call)",
			out["result"] == "transferred" && demo.transferCalls == 1,
			fmt.Sprintf("calls=%d body=%s", demo.transferCalls, reply.Body))
	}

	{
		reply := handler.HandleTransfer(ctx, transferPayload("TIKET-TX-2", "1000000000003"))
		var out map[string]any
		json.Unmarshal(reply.Body, &out)
		check("transfer of cancelled ticket → rejected",
			out["result"] == "rejected", string(reply.Body))
	}

	{
		bare := &protocol.Handler{Lookup: &demoLookup{tickets: demo.tickets, noTransfer: true}}
		reply := bare.HandleTransfer(ctx, transferPayload("TIKET-TX-3", "1000000000001"))
		var out map[string]any
		json.Unmarshal(reply.Body, &out)
		check("no transfer hook → not_supported", out["result"] == "not_supported", string(reply.Body))
	}

	total := passed + failures
	suffix := ""
	if failures == 0 {
		suffix = " — the agent is ready 🎉"
	}
	fmt.Printf("\n%d/%d checks passed%s\n", passed, total, suffix)
	return failures
}
