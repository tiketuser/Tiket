package lookup

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// HTTPLookup calls a partner-implemented INTERNAL endpoint (localhost or
// private network — see examples/lookup-endpoint/). The partner writes ~20
// lines in whatever language they already run:
//
//	GET  {lookup_url}?barcode=…      → 200 ticket-record JSON | 404
//	POST {transfer_url}              → {"ok":true,"new_barcode":…} (optional)
//
// No auth is required on these endpoints because they must never be exposed
// beyond the partner's network; the agent is the only caller.
type HTTPLookup struct {
	LookupURL   string
	TransferURL string // empty → transfers answer not_supported
	Client      *http.Client
}

func NewHTTPLookup(lookupURL, transferURL string) *HTTPLookup {
	return &HTTPLookup{
		LookupURL:   lookupURL,
		TransferURL: transferURL,
		Client:      &http.Client{Timeout: 10 * time.Second},
	}
}

func (h *HTTPLookup) Mode() string            { return "http" }
func (h *HTTPLookup) TransferSupported() bool { return h.TransferURL != "" }

func (h *HTTPLookup) Lookup(ctx context.Context, barcode string) (*Record, error) {
	u := h.LookupURL
	if bytes.ContainsRune([]byte(u), '?') {
		u += "&barcode=" + url.QueryEscape(barcode)
	} else {
		u += "?barcode=" + url.QueryEscape(barcode)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	res, err := h.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode == http.StatusNotFound {
		return nil, nil // unknown barcode
	}
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("lookup endpoint answered HTTP %d", res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 64*1024))
	if err != nil {
		return nil, err
	}
	var record Record
	if err := json.Unmarshal(body, &record); err != nil {
		return nil, fmt.Errorf("lookup endpoint returned invalid JSON: %w", err)
	}
	if record.Barcode == "" && record.EventName == "" && record.Venue == "" {
		return nil, nil // empty object → treat as unknown
	}
	return &record, nil
}

func (h *HTTPLookup) Transfer(ctx context.Context, tr TransferRequest, record *Record) (*TransferOutcome, error) {
	if h.TransferURL == "" {
		return nil, fmt.Errorf("transfer not configured")
	}
	payload, err := json.Marshal(map[string]any{"transfer": tr, "record": record})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, h.TransferURL, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := h.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("transfer endpoint answered HTTP %d", res.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(res.Body, 64*1024))
	if err != nil {
		return nil, err
	}
	var outcome TransferOutcome
	if err := json.Unmarshal(body, &outcome); err != nil {
		return nil, fmt.Errorf("transfer endpoint returned invalid JSON: %w", err)
	}
	return &outcome, nil
}
