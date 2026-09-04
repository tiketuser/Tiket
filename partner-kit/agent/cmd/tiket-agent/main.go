// tiket-agent — the Tiket Connect Agent.
//
// Runs inside the partner's network and makes OUTBOUND-only connections to
// TIKET (no inbound ports, no public URL, no TLS certificate on the partner
// side). Verification and ownership-transfer requests arrive HMAC-signed over
// the relay; the agent authenticates them with the partner-held secret, reads
// ticket data locally (partner's internal endpoint or read-only SQL), and
// answers with match verdicts only — customer data never leaves the network.
//
// Subcommands:
//
//	tiket-agent enroll  --token <pairing token> [--relay https://tiket.co.il]
//	tiket-agent run     [--config tiket-agent.conf]
//	tiket-agent selftest [--vectors ../../spec/test-vectors.json]
//	tiket-agent version
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"

	"github.com/tiket-il/tiket-connect-agent/internal/config"
	"github.com/tiket-il/tiket-connect-agent/internal/lookup"
	"github.com/tiket-il/tiket-connect-agent/internal/protocol"
	"github.com/tiket-il/tiket-connect-agent/internal/relay"
	"github.com/tiket-il/tiket-connect-agent/internal/selftest"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	switch os.Args[1] {
	case "run":
		cmdRun(os.Args[2:])
	case "enroll":
		cmdEnroll(os.Args[2:])
	case "selftest":
		cmdSelftest(os.Args[2:])
	case "version":
		fmt.Printf("tiket-agent %s (protocol v%s, %s/%s)\n", relay.Version, protocol.APIVersion, runtime.GOOS, runtime.GOARCH)
	default:
		usage()
		os.Exit(2)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, `tiket-agent — Tiket Connect Agent (outbound-only partner connector)

  tiket-agent enroll --token <pairing token> [--relay <url>] [--config <file>]
  tiket-agent run [--config <file>]
  tiket-agent selftest [--vectors <test-vectors.json>]
  tiket-agent version`)
}

func loadConfig(path string) *config.Config {
	// A missing default config file is fine (env-only setups); a named one isn't.
	if path == "tiket-agent.conf" {
		if _, err := os.Stat(path); err != nil {
			path = ""
		}
	}
	cfg, err := config.Load(path)
	if err != nil {
		log.Fatalf("tiket-agent: %v", err)
	}
	return cfg
}

func cmdEnroll(args []string) {
	fs := flag.NewFlagSet("enroll", flag.ExitOnError)
	token := fs.String("token", "", "one-time pairing token from TIKET")
	relayURL := fs.String("relay", "", "TIKET relay URL (default from config)")
	configPath := fs.String("config", "tiket-agent.conf", "config file")
	fs.Parse(args)

	cfg := loadConfig(*configPath)
	if *relayURL == "" {
		*relayURL = cfg.RelayURL
	}
	if *token == "" {
		log.Fatal("tiket-agent enroll: --token is required (generated in TIKET's admin panel)")
	}

	hostname, _ := os.Hostname()
	creds, err := relay.Enroll(context.Background(), *relayURL, *token, hostname, cfg.LookupMode, runtime.GOOS)
	if err != nil {
		log.Fatalf("tiket-agent: %v", err)
	}
	if err := config.SaveCredentials(cfg.CredentialsFile, creds); err != nil {
		log.Fatalf("tiket-agent: could not save credentials: %v", err)
	}
	abs, _ := filepath.Abs(cfg.CredentialsFile)
	fmt.Printf("Enrolled as agent %s for %q.\nCredentials saved to %s — keep this file private.\nStart the agent with: tiket-agent run\n",
		creds.AgentID, creds.ProviderName, abs)
}

func cmdRun(args []string) {
	fs := flag.NewFlagSet("run", flag.ExitOnError)
	configPath := fs.String("config", "tiket-agent.conf", "config file")
	fs.Parse(args)

	cfg := loadConfig(*configPath)
	if len(cfg.Secrets) == 0 {
		log.Fatal("tiket-agent: no signing secret configured (secret= in config, or TIKET_CONNECT_SECRET)")
	}

	creds, err := config.LoadCredentials(cfg.CredentialsFile)
	if err != nil {
		log.Fatalf("tiket-agent: %v (run `tiket-agent enroll --token …` first)", err)
	}

	var source lookup.TicketLookup
	switch cfg.LookupMode {
	case "http":
		if cfg.LookupURL == "" {
			log.Fatal("tiket-agent: lookup_url is required in http mode (your internal barcode-lookup endpoint)")
		}
		source = lookup.NewHTTPLookup(cfg.LookupURL, cfg.TransferURL)
	case "sql":
		if cfg.SQLDriver == "" || cfg.SQLDSN == "" || cfg.SQLQuery == "" {
			log.Fatal("tiket-agent: sql mode requires sql_driver, sql_dsn and sql_query (use a READ-ONLY database user)")
		}
		sqlSource, err := lookup.NewSQLLookup(cfg.SQLDriver, cfg.SQLDSN, cfg.SQLQuery, cfg.TransferURL)
		if err != nil {
			log.Fatalf("tiket-agent: %v", err)
		}
		pingCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := sqlSource.Ping(pingCtx); err != nil {
			log.Fatalf("tiket-agent: database unreachable: %v", err)
		}
		source = sqlSource
	}

	client := relay.New(cfg, creds, &protocol.Handler{Lookup: source})

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := client.Run(ctx); err != nil && ctx.Err() == nil {
		log.Fatalf("tiket-agent: %v", err)
	}
	log.Println("[tiket-agent] shut down")
}

func cmdSelftest(args []string) {
	fs := flag.NewFlagSet("selftest", flag.ExitOnError)
	vectors := fs.String("vectors", defaultVectorsPath(), "path to spec/test-vectors.json")
	fs.Parse(args)

	if failures := selftest.Run(*vectors); failures > 0 {
		os.Exit(1)
	}
}

// defaultVectorsPath finds spec/test-vectors.json whether running from the
// agent directory, the repo root, or next to a release binary that shipped
// the spec folder.
func defaultVectorsPath() string {
	candidates := []string{
		"../spec/test-vectors.json",
		"spec/test-vectors.json",
		"partner-kit/spec/test-vectors.json",
		"../../spec/test-vectors.json",
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return candidates[0]
}
