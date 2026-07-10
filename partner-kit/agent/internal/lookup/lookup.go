// Package lookup abstracts how the agent reads the partner's ticket data.
// All implementations run entirely inside the partner's network.
package lookup

import "context"

// Record is the partner's ticket as the protocol sees it. Field names mirror
// the JSON contract of node/tiket-connect.js lookupTicket.
type Record struct {
	Barcode       string  `json:"barcode"`
	EventName     string  `json:"event_name"`
	Artist        string  `json:"artist"`
	Venue         string  `json:"venue"`
	Date          string  `json:"date"`
	Time          string  `json:"time"`
	Section       string  `json:"section"`
	Row           string  `json:"row"`
	Seat          string  `json:"seat"`
	IsStanding    bool     `json:"is_standing"`
	Status        string   `json:"status"`
	OriginalPrice *float64 `json:"original_price"`
	Currency      string   `json:"currency"`
	TicketRef     string  `json:"ticket_ref"`
	EventRef      string  `json:"event_ref"`
	BarcodeFormat string  `json:"barcode_format"`
}

// TransferRequest is what the partner's transfer hook receives.
type TransferRequest struct {
	Barcode     string `json:"barcode"`
	TicketRef   string `json:"ticket_ref,omitempty"`
	TransferRef string `json:"transfer_ref"`
	NewHolder   struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
	} `json:"new_holder"`
}

// TransferOutcome is what the partner's transfer hook answers.
type TransferOutcome struct {
	OK            bool   `json:"ok"`
	NewBarcode    string `json:"new_barcode,omitempty"`
	BarcodeFormat string `json:"barcode_format,omitempty"`
	NewTicketRef  string `json:"new_ticket_ref,omitempty"`
	Delivery      string `json:"delivery,omitempty"`
	Reason        string `json:"reason,omitempty"`
}

// TicketLookup is the one integration surface a partner provides.
type TicketLookup interface {
	// Lookup returns the ticket for a barcode, or (nil, nil) when unknown.
	Lookup(ctx context.Context, barcode string) (*Record, error)
	// TransferSupported reports whether Transfer can be called.
	TransferSupported() bool
	// Transfer invalidates the old barcode and issues the ticket to the buyer.
	// Only called for existing, active tickets.
	Transfer(ctx context.Context, req TransferRequest, record *Record) (*TransferOutcome, error)
	// Mode is reported in heartbeats/admin ("http" | "sql" | "demo").
	Mode() string
}
