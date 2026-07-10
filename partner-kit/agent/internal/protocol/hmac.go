// Package protocol implements the Tiket Connect v1 wire protocol: HMAC
// request authentication and the verify/transfer handlers.
package protocol

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"math"
	"strconv"
	"time"
)

// DefaultToleranceSeconds is the replay-protection window.
const DefaultToleranceSeconds = 300

// ComputeSignature returns hex(HMAC_SHA256(secret, timestamp + "." + rawBody))
// — the Stripe-webhook scheme, identical to the Node kit and TIKET's engine.
func ComputeSignature(secret, timestamp string, rawBody []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp + "."))
	mac.Write(rawBody)
	return hex.EncodeToString(mac.Sum(nil))
}

// AuthError describes why authentication failed, using the protocol's
// stable error codes.
type AuthError struct{ Code string }

func (e *AuthError) Error() string { return e.Code }

// Authenticate verifies the timestamp window and signature. keyID selects the
// secret when present; otherwise every configured secret is tried (rotation).
// The signature is verified with hmac.Equal (constant time).
func Authenticate(secrets map[string]string, keyID, timestamp, signature string, rawBody []byte, toleranceSeconds int) error {
	if timestamp == "" || signature == "" {
		return &AuthError{Code: "missing_signature"}
	}
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return &AuthError{Code: "timestamp_out_of_range"}
	}
	if math.Abs(float64(time.Now().Unix()-ts)) > float64(toleranceSeconds) {
		return &AuthError{Code: "timestamp_out_of_range"}
	}

	candidates := secrets
	if keyID != "" {
		if secret, ok := secrets[keyID]; ok {
			candidates = map[string]string{keyID: secret}
		}
	}
	sigBytes := []byte(signature)
	for _, secret := range candidates {
		expected := []byte(ComputeSignature(secret, timestamp, rawBody))
		if hmac.Equal(expected, sigBytes) {
			return nil
		}
	}
	return &AuthError{Code: "invalid_signature"}
}
