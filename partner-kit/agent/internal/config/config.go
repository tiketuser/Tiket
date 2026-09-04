// Package config loads the agent's configuration from a simple `key = value`
// file plus TIKET_* environment overrides. The format is deliberately not
// YAML/TOML so the agent keeps a zero-dependency, fully auditable build.
package config

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// Config is everything the agent needs. See config.example.conf.
type Config struct {
	// RelayURL is TIKET's base URL (default https://tiket.co.il).
	RelayURL string
	// CredentialsFile stores the identity received at enrollment.
	CredentialsFile string
	// Secrets maps key-id → shared secret. The plain "secret" config key lands
	// under id "__default__" (matches requests without X-Tiket-Key-Id).
	Secrets map[string]string
	// LookupMode: "http" (partner-implemented internal endpoint) or "sql".
	LookupMode string
	// HTTP mode.
	LookupURL   string
	TransferURL string
	// SQL mode (Phase 3).
	SQLDriver string
	SQLDSN    string
	SQLQuery  string
	// ToleranceSeconds for the HMAC replay window.
	ToleranceSeconds int
}

// Credentials is the identity issued at enrollment.
type Credentials struct {
	AgentID      string `json:"agent_id"`
	AgentKey     string `json:"agent_key"`
	ProviderID   string `json:"provider_id"`
	ProviderName string `json:"provider_name"`
	RelayURL     string `json:"relay_url"`
}

// Load parses the config file (optional) and applies env overrides.
func Load(path string) (*Config, error) {
	cfg := &Config{
		RelayURL:         "https://tiket.co.il",
		CredentialsFile:  "tiket-agent-credentials.json",
		Secrets:          map[string]string{},
		LookupMode:       "http",
		ToleranceSeconds: 300,
	}

	if path != "" {
		if err := cfg.readFile(path); err != nil {
			return nil, err
		}
	}
	cfg.applyEnv()

	if cfg.LookupMode != "http" && cfg.LookupMode != "sql" {
		return nil, fmt.Errorf("lookup_mode must be \"http\" or \"sql\", got %q", cfg.LookupMode)
	}
	return cfg, nil
}

func (c *Config) readFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("config file: %w", err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	line := 0
	for scanner.Scan() {
		line++
		raw := strings.TrimSpace(scanner.Text())
		if raw == "" || strings.HasPrefix(raw, "#") || strings.HasPrefix(raw, ";") {
			continue
		}
		key, value, found := strings.Cut(raw, "=")
		if !found {
			return fmt.Errorf("config line %d: expected key = value", line)
		}
		c.set(strings.TrimSpace(strings.ToLower(key)), strings.TrimSpace(value))
	}
	return scanner.Err()
}

func (c *Config) set(key, value string) {
	switch {
	case key == "relay_url":
		c.RelayURL = strings.TrimSuffix(value, "/")
	case key == "credentials_file":
		c.CredentialsFile = value
	case key == "secret":
		c.Secrets["__default__"] = value
	case strings.HasPrefix(key, "secret."):
		c.Secrets[strings.TrimPrefix(key, "secret.")] = value
	case key == "lookup_mode":
		c.LookupMode = strings.ToLower(value)
	case key == "lookup_url":
		c.LookupURL = value
	case key == "transfer_url":
		c.TransferURL = value
	case key == "sql_driver":
		c.SQLDriver = strings.ToLower(value)
	case key == "sql_dsn":
		c.SQLDSN = value
	case key == "sql_query":
		c.SQLQuery = value
	case key == "tolerance_seconds":
		fmt.Sscanf(value, "%d", &c.ToleranceSeconds)
	}
}

func (c *Config) applyEnv() {
	overrides := map[string]string{
		"TIKET_RELAY_URL":        "relay_url",
		"TIKET_CREDENTIALS_FILE": "credentials_file",
		"TIKET_CONNECT_SECRET":   "secret",
		"TIKET_LOOKUP_MODE":      "lookup_mode",
		"TIKET_LOOKUP_URL":       "lookup_url",
		"TIKET_TRANSFER_URL":     "transfer_url",
		"TIKET_SQL_DRIVER":       "sql_driver",
		"TIKET_SQL_DSN":          "sql_dsn",
		"TIKET_SQL_QUERY":        "sql_query",
	}
	for env, key := range overrides {
		if v := os.Getenv(env); v != "" {
			c.set(key, v)
		}
	}
	// TIKET_CONNECT_SECRETS="k_old:secretA,k_new:secretB"
	if v := os.Getenv("TIKET_CONNECT_SECRETS"); v != "" {
		for _, pair := range strings.Split(v, ",") {
			id, secret, found := strings.Cut(strings.TrimSpace(pair), ":")
			if found && id != "" && secret != "" {
				c.Secrets[id] = secret
			}
		}
	}
}

// LoadCredentials reads the enrollment identity.
func LoadCredentials(path string) (*Credentials, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var creds Credentials
	if err := json.Unmarshal(data, &creds); err != nil {
		return nil, fmt.Errorf("credentials file %s: %w", path, err)
	}
	if creds.AgentID == "" || creds.AgentKey == "" {
		return nil, fmt.Errorf("credentials file %s is incomplete — re-run enroll", path)
	}
	return &creds, nil
}

// SaveCredentials writes the enrollment identity with owner-only permissions.
func SaveCredentials(path string, creds *Credentials) error {
	data, err := json.MarshalIndent(creds, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o600)
}
