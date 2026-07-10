// Package compare implements the Tiket Connect field-comparison and
// confidence-scoring semantics.
//
// This is a 1:1 port of compareClaimToRecord in node/tiket-connect.js. The two
// implementations are kept in lockstep by the shared spec vectors
// (partner-kit/spec/test-vectors.json); any semantic change must land there
// first. Field order in Matched/Unmatched is part of the contract.
package compare

import (
	"fmt"
	"math"
	"regexp"
	"strings"
)

// CriticalFields are hard gates: a ticket failing any of them is a mismatch
// regardless of score (a ticket matching everything except the date is a
// ticket for a different night, not a 90% match).
var CriticalFields = []string{"barcode", "artist", "date", "venue"}

// MatchThreshold is the confidence at (or above) which a ticket with no
// critical failures is a "match".
const MatchThreshold = 90

var (
	spaceRe   = regexp.MustCompile(`\s+`)
	isoDateRe = regexp.MustCompile(`^(\d{4})-(\d{2})-(\d{2})`)
	dmyDateRe = regexp.MustCompile(`^(\d{1,2})/(\d{1,2})/(\d{4})$`)
	timeRe    = regexp.MustCompile(`^(\d{1,2}):(\d{2})`)
	seatZerRe = regexp.MustCompile(`^0+([0-9])`)
)

// NormText lower-cases, trims and collapses whitespace.
func NormText(value string) string {
	return spaceRe.ReplaceAllString(strings.TrimSpace(strings.ToLower(value)), " ")
}

// textMatches is the loose match: equal, or one contains the other
// (handles "היכל מנורה" vs "היכל מנורה מבטחים").
func textMatches(a, b string) bool {
	na, nb := NormText(a), NormText(b)
	if na == "" || nb == "" {
		return false
	}
	return na == nb || strings.Contains(na, nb) || strings.Contains(nb, na)
}

// pad2 zero-pads a 1-2 digit numeric string ("7" → "07").
func pad2(s string) string {
	if len(s) == 1 {
		return "0" + s
	}
	return s
}

// NormDate normalizes "YYYY-MM-DD", ISO datetimes and "DD/MM/YYYY" (or with
// dots) to "YYYY-MM-DD"; anything else passes through.
func NormDate(value string) string {
	s := strings.TrimSpace(value)
	if m := isoDateRe.FindStringSubmatch(s); m != nil {
		return fmt.Sprintf("%s-%s-%s", m[1], m[2], m[3])
	}
	if m := dmyDateRe.FindStringSubmatch(strings.ReplaceAll(s, ".", "/")); m != nil {
		return fmt.Sprintf("%s-%s-%s", m[3], pad2(m[2]), pad2(m[1]))
	}
	return s
}

// NormTime normalizes "21:00:00" / "21:00" / " 9:05 " to "HH:MM"; empty when unparseable.
func NormTime(value string) string {
	if m := timeRe.FindStringSubmatch(strings.TrimSpace(value)); m != nil {
		return pad2(m[1]) + ":" + m[2]
	}
	return ""
}

// NormSeatPart normalizes seat/row/section values ("07" == "7").
func NormSeatPart(value string) string {
	return seatZerRe.ReplaceAllString(NormText(value), "$1")
}

// Ticket is one side of a comparison — the claim TIKET relays, or the record
// the partner's lookup returned. Values are pre-stringified by the caller
// (JSON numbers tolerated for section/row/seat).
type Ticket struct {
	Barcode    string
	EventName  string
	Artist     string
	Venue      string
	Date       string
	Time       string
	Section    string
	Row        string
	Seat       string
	IsStanding bool
}

// Result mirrors the Node kit's return shape.
type Result struct {
	Confidence     int
	Matched        []string
	Unmatched      []string
	CriticalFailed bool
}

// Compare scores a claim against a record. Weights: barcode 40,
// artist/event 20, date 20, venue 15, time 5, seat block up to 10; confidence
// is normalized to the comparable fields so missing optional data isn't a
// penalty.
func Compare(claim, record Ticket) Result {
	matched := []string{}
	unmatched := []string{}
	score, maxScore := 0, 0

	// Barcode — the record was found BY barcode, but verify to catch lookup bugs.
	maxScore += 40
	if record.Barcode == "" || NormText(record.Barcode) == NormText(claim.Barcode) {
		score += 40
		matched = append(matched, "barcode")
	} else {
		unmatched = append(unmatched, "barcode")
	}

	// Artist / event name — the claim's artist may appear in either field.
	claimedArtist := claim.Artist
	if claimedArtist == "" {
		claimedArtist = claim.EventName
	}
	maxScore += 20
	if textMatches(claimedArtist, record.EventName) ||
		textMatches(claimedArtist, record.Artist) ||
		textMatches(claim.EventName, record.EventName) {
		score += 20
		matched = append(matched, "artist")
	} else {
		unmatched = append(unmatched, "artist")
	}

	maxScore += 20
	if NormDate(claim.Date) == NormDate(record.Date) {
		score += 20
		matched = append(matched, "date")
	} else {
		unmatched = append(unmatched, "date")
	}

	maxScore += 15
	if textMatches(claim.Venue, record.Venue) {
		score += 15
		matched = append(matched, "venue")
	} else {
		unmatched = append(unmatched, "venue")
	}

	if claim.Time != "" && record.Time != "" {
		maxScore += 5
		if NormTime(claim.Time) == NormTime(record.Time) {
			score += 5
			matched = append(matched, "time")
		} else {
			unmatched = append(unmatched, "time")
		}
	}

	if claim.IsStanding && record.IsStanding {
		maxScore += 10
		score += 10
		matched = append(matched, "seat_type")
	} else if !claim.IsStanding && !record.IsStanding {
		seatParts := []struct {
			field         string
			weight        int
			claimV, recV  string
		}{
			{"section", 4, claim.Section, record.Section},
			{"row", 3, claim.Row, record.Row},
			{"seat", 3, claim.Seat, record.Seat},
		}
		for _, p := range seatParts {
			if p.claimV == "" && p.recV == "" {
				continue // neither side has it — neutral
			}
			maxScore += p.weight
			if NormSeatPart(p.claimV) == NormSeatPart(p.recV) {
				score += p.weight
				matched = append(matched, p.field)
			} else {
				unmatched = append(unmatched, p.field)
			}
		}
	} else {
		maxScore += 10
		unmatched = append(unmatched, "seat_type") // one side standing, the other seated
	}

	confidence := 0
	if maxScore > 0 {
		confidence = int(math.Round(float64(score) / float64(maxScore) * 100))
	}
	critical := false
	for _, f := range unmatched {
		for _, c := range CriticalFields {
			if f == c {
				critical = true
			}
		}
	}
	return Result{Confidence: confidence, Matched: matched, Unmatched: unmatched, CriticalFailed: critical}
}
