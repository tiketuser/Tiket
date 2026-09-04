// Package relay implements the agent's outbound-only connection to TIKET:
// a long poll against /api/agent/poll and answers via /api/agent/respond.
// The partner opens NO inbound ports — both calls originate here.
package relay

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/tiket-il/tiket-connect-agent/internal/config"
	"github.com/tiket-il/tiket-connect-agent/internal/protocol"
)

// Version of the agent build, reported in heartbeats and `version`.
const Version = "1.0.0"

// pollTimeout must exceed the server's 25s hold.
const pollTimeout = 40 * time.Second

type pollResponse struct {
	RequestID string            `json:"request_id"`
	Kind      string            `json:"kind"`
	Path      string            `json:"path"`
	Headers   map[string]string `json:"headers"`
	Body      string            `json:"body"`
}

// Client drives the poll → authenticate → handle → respond loop.
type Client struct {
	Config      *config.Config
	Credentials *config.Credentials
	Handler     *protocol.Handler
	HTTP        *http.Client
}

func New(cfg *config.Config, creds *config.Credentials, handler *protocol.Handler) *Client {
	return &Client{
		Config:      cfg,
		Credentials: creds,
		Handler:     handler,
		HTTP:        &http.Client{Timeout: pollTimeout},
	}
}

func (c *Client) relayURL() string {
	if c.Credentials.RelayURL != "" {
		return c.Credentials.RelayURL
	}
	return c.Config.RelayURL
}

// Run polls until ctx is cancelled, with exponential backoff on relay errors.
func (c *Client) Run(ctx context.Context) error {
	backoff := time.Second
	log.Printf("[tiket-agent] v%s connected mode=%s provider=%s relay=%s",
		Version, c.Handler.Lookup.Mode(), c.Credentials.ProviderName, c.relayURL())

	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		handled, err := c.pollOnce(ctx)
		switch {
		case err != nil:
			log.Printf("[tiket-agent] relay error (retrying in %s): %v", backoff, err)
			select {
			case <-time.After(backoff):
			case <-ctx.Done():
				return ctx.Err()
			}
			if backoff < 60*time.Second {
				backoff *= 2
			}
		default:
			backoff = time.Second
			_ = handled
		}
	}
}

// pollOnce holds one long poll; when work arrives it is handled and answered.
func (c *Client) pollOnce(ctx context.Context) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.relayURL()+"/api/agent/poll", nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+c.Credentials.AgentKey)
	req.Header.Set("X-Tiket-Agent-Id", c.Credentials.AgentID)
	req.Header.Set("X-Tiket-Agent-Version", Version)
	req.Header.Set("X-Tiket-Lookup-Mode", c.Handler.Lookup.Mode())

	res, err := c.HTTP.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()

	switch res.StatusCode {
	case http.StatusNoContent:
		return false, nil
	case http.StatusUnauthorized:
		return false, fmt.Errorf("relay rejected credentials (revoked?) — re-enroll if this persists")
	case http.StatusOK:
		// handled below
	default:
		return false, fmt.Errorf("relay answered HTTP %d", res.StatusCode)
	}

	raw, err := io.ReadAll(io.LimitReader(res.Body, 256*1024))
	if err != nil {
		return false, err
	}
	var work pollResponse
	if err := json.Unmarshal(raw, &work); err != nil {
		return false, fmt.Errorf("relay sent invalid JSON: %w", err)
	}

	reply := c.handle(ctx, &work)
	if err := c.respond(ctx, work.RequestID, reply); err != nil {
		return true, fmt.Errorf("failed to deliver answer for %s: %w", work.RequestID, err)
	}
	return true, nil
}

// handle authenticates the relayed envelope END-TO-END (the relay is not
// trusted: only TIKET holds the signing secret) and dispatches it.
func (c *Client) handle(ctx context.Context, work *pollResponse) protocol.Reply {
	header := func(name string) string {
		for k, v := range work.Headers {
			if strings.EqualFold(k, name) {
				return v
			}
		}
		return ""
	}

	body := []byte(work.Body)
	if err := protocol.Authenticate(
		c.Config.Secrets,
		header("X-Tiket-Key-Id"),
		header("X-Tiket-Timestamp"),
		header("X-Tiket-Signature"),
		body,
		c.Config.ToleranceSeconds,
	); err != nil {
		log.Printf("[tiket-agent] rejected envelope: %v", err)
		return protocol.Reply{Status: 401, Body: []byte(fmt.Sprintf(`{"error":%q}`, err.Error()))}
	}

	kind := work.Kind
	if kind == "" {
		// Fall back to the path suffix for forward compatibility.
		if strings.HasSuffix(work.Path, "/transfer") {
			kind = "transfer"
		} else {
			kind = "verify"
		}
	}

	handleCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	switch kind {
	case "verify":
		return c.Handler.HandleVerify(handleCtx, body)
	case "transfer":
		return c.Handler.HandleTransfer(handleCtx, body)
	case "ping":
		return protocol.Reply{Status: 200, Body: []byte(`{"ok":true}`)}
	default:
		return protocol.Reply{Status: 400, Body: []byte(`{"error":"unknown_kind"}`)}
	}
}

func (c *Client) respond(ctx context.Context, requestID string, reply protocol.Reply) error {
	payload, err := json.Marshal(map[string]any{
		"request_id":  requestID,
		"http_status": reply.Status,
		"body":        string(reply.Body),
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.relayURL()+"/api/agent/respond", bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.Credentials.AgentKey)
	req.Header.Set("X-Tiket-Agent-Id", c.Credentials.AgentID)

	res, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("respond answered HTTP %d", res.StatusCode)
	}
	return nil
}

// Enroll exchanges a one-time pairing token for permanent credentials.
func Enroll(ctx context.Context, relayURL, token, hostname, lookupMode, platform string) (*config.Credentials, error) {
	payload, err := json.Marshal(map[string]string{
		"enroll_token":  token,
		"name":          hostname,
		"agent_version": Version,
		"platform":      platform,
		"lookup_mode":   lookupMode,
	})
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimSuffix(relayURL, "/")+"/api/agent/enroll", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(res.Body, 64*1024))
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("enroll failed: HTTP %d %s", res.StatusCode, strings.TrimSpace(string(raw)))
	}

	var out struct {
		AgentID      string `json:"agent_id"`
		AgentKey     string `json:"agent_key"`
		ProviderID   string `json:"provider_id"`
		ProviderName string `json:"provider_name"`
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil, fmt.Errorf("enroll answered invalid JSON: %w", err)
	}
	return &config.Credentials{
		AgentID:      out.AgentID,
		AgentKey:     out.AgentKey,
		ProviderID:   out.ProviderID,
		ProviderName: out.ProviderName,
		RelayURL:     strings.TrimSuffix(relayURL, "/"),
	}, nil
}
