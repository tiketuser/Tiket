"use client";

import { useState, useRef, useCallback } from "react";
import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import AuthDialog from "../AuthDialog/AuthDialog";
import ProgressBar from "../ProgressBar/ProgressBar";

import StepOneUploadTicket from "./UploadTicketSteps/StepOneUploadTicket";
import StepTwoUploadTicket from "./UploadTicketSteps/StepTwoUploadTicket";
import StepThreeUploadTicket from "./UploadTicketSteps/StepThreeUploadTicket";
import StepFourBankDetails from "./UploadTicketSteps/StepFourBankDetails";
import StepFiveUploadTicket from "./UploadTicketSteps/StepFiveUploadTicket";
import { TicketData } from "./UploadTicketSteps/UploadTicketInterface.types";

// Firebase imports
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Firestore,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../../firebase";
import { artistNamesMatch } from "../../../../utils/artistMatcher";

interface UploadTicketInterface {
  isOpen: boolean;
  onClose: () => void;
}

const UploadTicketDialog: React.FC<UploadTicketInterface> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [ticketData, setTicketData] = useState<TicketData>({});
  const [savedTickets, setSavedTickets] = useState<TicketData[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [publishWarning, setPublishWarning] = useState<string | null>(null);
  const [canSplit, setCanSplit] = useState<boolean>(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // true = user already has bank details configured (bank step is skipped entirely)
  const [bankStepSkipped, setBankStepSkipped] = useState(false);
  // Pending ticket data to save once auth completes
  const pendingProceedData = useRef<TicketData | null>(null);

  // Save current ticket and add another
  const saveAndAddAnother = (updatedTicketData?: TicketData) => {
    // Use provided data or current ticketData
    const dataToSave = updatedTicketData || ticketData;
    console.log("saveAndAddAnother - saving ticket:", dataToSave);
    // Save current ticket to the list
    setSavedTickets((prev) => [...prev, dataToSave]);
    // Reset current ticket data
    setTicketData({});
    // Go back to step 1
    setStep(1);
  };

  // Check if user has bank details configured, then go to the right step
  const goToNextAfterTicket = useCallback(async (dataToSave: TicketData) => {
    setSavedTickets((prev) => [...prev, dataToSave]);
    setIsTransitioning(true);
    try {
      const idToken = await getAuth().currentUser!.getIdToken();
      const res = await fetch("/api/seller/payment-details", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.hasPaymentDetails) {
          setBankStepSkipped(true);
          setStep(5);
          setIsTransitioning(false);
          return;
        }
      }
    } catch {
      // On error, show the bank form
    }
    setBankStepSkipped(false);
    setStep(4);
    setIsTransitioning(false);
  }, []);

  // Move to step 4/5 with current ticket — gates on auth first
  const proceedToReview = (updatedTicketData?: TicketData) => {
    const dataToSave = updatedTicketData || ticketData;
    const user = getAuth().currentUser;

    if (!user) {
      // Store the pending data and show auth dialog
      pendingProceedData.current = dataToSave;
      setShowAuthDialog(true);
      return;
    }

    goToNextAfterTicket(dataToSave);
  };

  // Called when auth dialog closes — if user is now logged in, continue
  const handleAuthClose = () => {
    setShowAuthDialog(false);
    const user = getAuth().currentUser;
    if (user && pendingProceedData.current) {
      const dataToSave = pendingProceedData.current;
      pendingProceedData.current = null;
      goToNextAfterTicket(dataToSave);
    } else {
      pendingProceedData.current = null;
    }
  };

  // Enhanced nextStep function
  const nextStep = async () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep((prev) => Math.min(prev + 1, 5));
      setIsTransitioning(false);
    }, 300);
  };

  const prevStep = () => {
    setIsTransitioning(true);
    // If going back from step 4 (bank) to step 3, remove the last saved ticket
    // so the user can edit it instead of creating a duplicate
    if (step === 4 && savedTickets.length > 0) {
      const lastTicket = savedTickets[savedTickets.length - 1];
      setSavedTickets((prev) => prev.slice(0, -1));
      setTicketData(lastTicket);
    }
    // If going back from step 5 (review), clear publish state
    if (step === 5) {
      setPublishError(null);
      setPublishSuccess(null);
      setPublishWarning(null);
      // If bank step was skipped, jump back to step 3 instead of step 4
      if (bankStepSkipped) {
        const lastTicket = savedTickets[savedTickets.length - 1];
        setSavedTickets((prev) => prev.slice(0, -1));
        setTicketData(lastTicket);
        setStep(3);
        setIsTransitioning(false);
        return;
      }
    }
    setStep((prev) => Math.max(prev - 1, 1));
    setIsTransitioning(false);
  };

  // Function to update ticket data
  const updateTicketData = (updates: Partial<TicketData>) => {
    console.log("UploadTicketDialog - updateTicketData called with:", updates);
    setTicketData((prev) => {
      const newData = { ...prev, ...updates };
      console.log("UploadTicketDialog - new ticketData state:", newData);
      return newData;
    });
  };

  // Reset dialog state when closing
  const handleClose = () => {
    setStep(1);
    setTicketData({});
    setSavedTickets([]);
    setIsPublishing(false);
    setPublishError(null);
    setPublishSuccess(null);
    setCanSplit(true);
    setShowAuthDialog(false);
    setBankStepSkipped(false);
    pendingProceedData.current = null;
    onClose();
  };

  // Find or create event, then publish tickets
  const publishAllTickets = async () => {
    console.log("publishAllTickets called, savedTickets:", savedTickets);

    if (!db) {
      console.error("Firebase not initialized:", { db });
      setPublishError("מסד הנתונים לא זמין כרגע");
      return false;
    }

    const firestore = db;
    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);

    try {
      console.log(`Starting to publish ${savedTickets.length} tickets`);
      let publishedCount = 0;
      let skippedCount = 0;
      let verifiedCount = 0; // Auto-approved tickets
      let needsReviewCount = 0; // Manual review needed
      let rejectedCount = 0; // Failed verification

      // Group tickets by event (artist + date + venue)
      const ticketsByConcert = new Map<string, typeof savedTickets>();

      for (const ticket of savedTickets) {
        const eventKey = `${ticket.ticketDetails?.artist}-${ticket.ticketDetails?.date}-${ticket.ticketDetails?.venue}`;
        if (!ticketsByConcert.has(eventKey)) {
          ticketsByConcert.set(eventKey, []);
        }
        ticketsByConcert.get(eventKey)?.push(ticket);
      }

      console.log(`Found ${ticketsByConcert.size} unique events`);

      // Process each event group
      for (const [eventKey, tickets] of ticketsByConcert) {
        const firstTicket = tickets[0];
        const artist = firstTicket.ticketDetails?.artist || "";
        const date = firstTicket.ticketDetails?.date || "";
        const venue = firstTicket.ticketDetails?.venue || "";
        const time = firstTicket.ticketDetails?.time || "";

        console.log(`Processing event: ${artist} on ${date} at ${venue}`);

        // Normalize strings for better matching
        const normalizeString = (str: string) =>
          str.trim().toLowerCase().replace(/\s+/g, " ");

        // Normalize date to dd/mm/yyyy format
        const normalizeDate = (dateStr: string): string => {
          // Convert dots to slashes first
          const normalized = dateStr.replace(/\./g, "/");

          // If already in dd/mm/yyyy format (possibly single-digit), zero-pad and return
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
            const [d, m, y] = normalized.split("/");
            return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
          }

          // Try to parse other date formats
          // Format: "DD MMM" or "DD MMMM" (e.g., "06 DEC" or "6 בדצמבר")
          const hebrewMonths: { [key: string]: string } = {
            ינואר: "01",
            פברואר: "02",
            מרץ: "03",
            אפריל: "04",
            מאי: "05",
            יוני: "06",
            יולי: "07",
            אוגוסט: "08",
            ספטמבר: "09",
            אוקטובר: "10",
            נובמבר: "11",
            דצמבר: "12",
          };

          const englishMonths: { [key: string]: string } = {
            jan: "01",
            feb: "02",
            mar: "03",
            apr: "04",
            may: "05",
            jun: "06",
            jul: "07",
            aug: "08",
            sep: "09",
            oct: "10",
            nov: "11",
            dec: "12",
          };

          // Try parsing "DD MMM YYYY" or "DD MMM"
          const parts = dateStr.trim().split(/[\s/\-\.]+/);
          if (parts.length >= 2) {
            const day = parts[0].padStart(2, "0");
            const monthStr = parts[1].toLowerCase();
            let month =
              hebrewMonths[monthStr] || englishMonths[monthStr.substring(0, 3)];
            const year = parts[2] || new Date().getFullYear().toString();

            if (month) {
              return `${day}/${month}/${year}`;
            }
          }

          return dateStr; // Return as is if can't parse
        };

        const normalizedArtist = normalizeString(artist);
        const normalizedVenue = normalizeString(venue);
        const normalizedDate = normalizeDate(date);

        console.log("Normalized search criteria:", {
          artist: normalizedArtist,
          date: normalizedDate,
          venue: normalizedVenue,
        });

        // Fetch all events and do flexible matching (case-insensitive)
        // This avoids Firestore case-sensitive query limitations
        console.log("Fetching all events for flexible matching...");

        const allConcertsQuery = query(collection(firestore, "events"));
        const allConcerts = await getDocs(allConcertsQuery);

        const matchingConcerts = allConcerts.docs.filter((doc) => {
          const data = doc.data();
          const eventArtist = data.artist || "";
          const eventVenue = normalizeString(data.venue || "");
          const eventDate = normalizeDate(data.date || "");

          // Use smart artist matching (handles Hebrew/English variations)
          const artistMatch = artistNamesMatch(artist, eventArtist);

          // Venue: partial match — one must contain the other (handles "היכל מנורה" vs "היכל מנורה מבטחים")
          const venueMatch =
            eventVenue === normalizedVenue ||
            eventVenue.includes(normalizedVenue) ||
            normalizedVenue.includes(eventVenue);

          const dateMatch = eventDate === normalizedDate;

          console.log(`Comparing with event ${doc.id}:`, {
            ticketArtist: artist,
            eventArtist: eventArtist,
            artistMatch,
            venueMatch: `"${eventVenue}" ~ "${normalizedVenue}" = ${venueMatch}`,
            dateMatch: `"${eventDate}" === "${normalizedDate}" = ${dateMatch}`,
          });

          return artistMatch && venueMatch && dateMatch;
        });

        let eventsSnapshot = {
          empty: matchingConcerts.length === 0,
          docs: matchingConcerts,
        } as any;

        if (matchingConcerts.length > 0) {
          console.log(
            `✅ Found ${matchingConcerts.length} matching event(s) via flexible search`,
          );
        } else {
          console.log("❌ No matching events found");
        }

        let eventId: string | null = null;

        if (!eventsSnapshot.empty) {
          // Concert exists, use existing ID
          eventId = eventsSnapshot.docs[0].id;
          console.log(`Found existing event with ID: ${eventId}`);
        } else {
          // No matching event found - tickets will be marked as pending
          console.log(
            "Concert not found, tickets will be marked as pending...",
          );
        }

        // Generate a bundleId for this event group if it has 2+ tickets
        const bundleId: string | null =
          tickets.length > 1 ? crypto.randomUUID() : null;
        const bundleSize = tickets.length;

        // Now publish all tickets for this event
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          console.log(
            `Publishing ticket ${i + 1}/${tickets.length} for event ${
              eventId || "pending"
            }`,
          );
          console.log(
            "TICKET DATA BEING PUBLISHED:",
            JSON.stringify(ticket, null, 2),
          );
          console.log("TICKET ROW:", ticket.ticketDetails?.row);
          console.log("TICKET SECTION:", ticket.ticketDetails?.section);
          console.log("TICKET SEAT:", ticket.ticketDetails?.seat);

          // 🔍 STEP 0: Check for duplicate tickets
          console.log(" Checking for duplicate tickets...");
          try {
            const duplicateCheck = await fetch("/api/check-duplicate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                barcode: ticket.ticketDetails?.barcode || "",
                artist: ticket.ticketDetails?.artist || "",
                venue: ticket.ticketDetails?.venue || "",
                date: normalizedDate,
                time: ticket.ticketDetails?.time || "",
                seat: ticket.ticketDetails?.seat || "",
                row: ticket.ticketDetails?.row || "",
                section: ticket.ticketDetails?.section || "",
              }),
            });

            const duplicateResult = await duplicateCheck.json();

            if (duplicateResult.isDuplicate) {
              console.error("🚫 Duplicate ticket detected:", duplicateResult);
              const matchType = duplicateResult.duplicates[0]?.matchType;
              const existingTicket = duplicateResult.duplicates[0]?.ticket;

              let errorMessage = "";
              if (matchType === "barcode") {
                errorMessage = `⚠️ כרטיס עם ברקוד זהה כבר קיים במערכת\n\nפרטי הכרטיס הקיים במערכת:\n• אירוע: ${
                  existingTicket.artist
                }\n• מקום: ${existingTicket.venue}\n• תאריך: ${
                  existingTicket.date
                }\n• מיקום: ${
                  existingTicket.section ? `אזור ${existingTicket.section}` : ""
                } ${existingTicket.row ? `שורה ${existingTicket.row}` : ""} ${
                  existingTicket.seat ? `מושב ${existingTicket.seat}` : ""
                }\n• סטטוס: ${
                  existingTicket.status === "available"
                    ? "מפורסם"
                    : existingTicket.status === "pending_approval"
                      ? "ממתין לאישור"
                      : "נדחה"
                }\n\nהכרטיס שניסית להעלות:\n• מיקום: ${
                  ticket.ticketDetails?.section
                    ? `אזור ${ticket.ticketDetails.section}`
                    : ""
                } ${
                  ticket.ticketDetails?.row
                    ? `שורה ${ticket.ticketDetails.row}`
                    : ""
                } ${
                  ticket.ticketDetails?.seat
                    ? `מושב ${ticket.ticketDetails.seat}`
                    : ""
                }\n\nלא ניתן להעלות כרטיס כפול.`;
              } else {
                errorMessage = `⚠️ כרטיס זהה באותו מקום כבר קיים במערכת\n\nפרטי הכרטיס הקיים במערכת:\n• ${
                  existingTicket.artist
                }\n• ${existingTicket.venue}\n• ${existingTicket.date} בשעה ${
                  existingTicket.time
                }\n• מיקום: ${
                  existingTicket.section ? `אזור ${existingTicket.section}` : ""
                } ${existingTicket.row ? `שורה ${existingTicket.row}` : ""} ${
                  existingTicket.seat ? `מושב ${existingTicket.seat}` : ""
                }\n\nהכרטיס שניסית להעלות:\n• מיקום: ${
                  ticket.ticketDetails?.section
                    ? `אזור ${ticket.ticketDetails.section}`
                    : ""
                } ${
                  ticket.ticketDetails?.row
                    ? `שורה ${ticket.ticketDetails.row}`
                    : ""
                } ${
                  ticket.ticketDetails?.seat
                    ? `מושב ${ticket.ticketDetails.seat}`
                    : ""
                }\n\nלא ניתן להעלות את אותו מקום פעמיים.`;
              }

              setPublishError(errorMessage);
              setIsPublishing(false);
              return false;
            }

            console.log("✅ No duplicate found, proceeding with upload");
          } catch (error) {
            console.error("❌ Duplicate check error:", error);
            // Continue with upload even if duplicate check fails (don't block user)
            console.warn(
              "⚠️ Continuing with upload despite duplicate check error",
            );
          }

          // 🔍 STEP 1: Verify ticket with venue API
          console.log("🔍 Calling venue verification API...");
          let verificationResult: any = null;
          try {
            const verifyResponse = await fetch("/api/venue-verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                barcode: ticket.ticketDetails?.barcode || "",
                artist: ticket.ticketDetails?.artist || "",
                eventName: ticket.ticketDetails?.artist || "",
                venue: ticket.ticketDetails?.venue || "",
                date: normalizedDate,
                time: ticket.ticketDetails?.time || "",
                section: ticket.ticketDetails?.section || "",
                row: ticket.ticketDetails?.row || "",
                seat: ticket.ticketDetails?.seat || "",
                isStanding: ticket.ticketDetails?.isStanding || false,
              }),
            });
            verificationResult = await verifyResponse.json();
            console.log("✅ Verification result:", verificationResult);
          } catch (error) {
            console.error("❌ Verification API error:", error);
            // If verification fails, default to manual review
            verificationResult = {
              verified: false,
              confidence: 0,
              status: "needs_review",
              matchedFields: [],
              unmatchedFields: [],
              reason:
                "Verification service unavailable - manual review required",
              timestamp: new Date().toISOString(),
            };
          }

          // Upload ticket image to Firebase Storage
          let ticketImageUrl: string | null = null;
          if (ticket.uploadedFile) {
            try {
              const uploadFormData = new FormData();
              uploadFormData.append("file", ticket.uploadedFile);
              const uploadRes = await fetch("/api/upload-ticket-image", {
                method: "POST",
                body: uploadFormData,
              });
              if (uploadRes.ok) {
                const { imageUrl } = await uploadRes.json();
                ticketImageUrl = imageUrl;
                console.log("✅ Uploaded ticket image to Storage");
              } else {
                console.warn("Failed to upload ticket image to Storage");
              }
            } catch (error) {
              console.warn("Failed to upload ticket image:", error);
            }
          }

          // Determine ticket status based on verification
          let ticketStatus = "rejected";
          if (verificationResult.status === "verified") {
            ticketStatus = "available"; // Auto-approved!
          } else if (verificationResult.status === "needs_review") {
            ticketStatus = "pending_approval"; // Manual review required
          } else {
            ticketStatus = "rejected"; // Failed verification
          }

          const ticketDoc = {
            eventId: eventId || null, // null if no matching event
            artist: ticket.ticketDetails?.artist || "",
            category: ticket.ticketDetails?.category || "מוזיקה",
            date: normalizedDate, // Use normalized date format
            time: ticket.ticketDetails?.time || "",
            venue: ticket.ticketDetails?.venue || "",
            section: ticket.ticketDetails?.section || "",
            block: ticket.ticketDetails?.block || "",
            row: ticket.ticketDetails?.row || "",
            seat: ticket.ticketDetails?.seat || "",
            barcode: ticket.ticketDetails?.barcode || null, // Store barcode for verification
            isStanding: ticket.ticketDetails?.isStanding || false,
            askingPrice: ticket.pricing?.askingPrice,
            originalPrice: ticket.ticketDetails?.originalPrice || null,
            allowPriceSuggestions:
              ticket.pricing?.allowPriceSuggestions || false,
            minPrice: ticket.pricing?.minPrice || null,
            maxPrice: ticket.pricing?.maxPrice || null,
            extractedText: ticket.extractedText || null,
            ticketImage: ticketImageUrl, // Storage URL for uploaded ticket image
            status: ticketStatus, // Set based on verification result
            // Verification details
            verificationStatus: verificationResult.status,
            verificationConfidence: verificationResult.confidence,
            verificationDetails: {
              matchedFields: verificationResult.matchedFields || [],
              unmatchedFields: verificationResult.unmatchedFields || [],
              officialTicketId:
                verificationResult.details?.officialTicketId || null,
              eventId: verificationResult.details?.eventId || null,
              ticketingSystem:
                verificationResult.details?.ticketingSystem || null,
              reason: verificationResult.reason,
              apiResponse: verificationResult,
            },
            verificationTimestamp: serverTimestamp(),
            createdAt: serverTimestamp(),
            sellerId: getAuth().currentUser?.uid || "anonymous",
            bundleId: bundleId,
            canSplit: bundleId !== null ? canSplit : null,
            bundleSize: bundleId !== null ? bundleSize : null,
          };

          const ticketRef = await addDoc(
            collection(firestore, "tickets"),
            ticketDoc,
          );
          console.log(
            `✅ Ticket saved with ID: ${ticketRef.id}, status: ${ticketDoc.status}, eventId: ${ticketDoc.eventId}`,
          );
          console.log("Ticket data:", ticketDoc);

          // Add to mock_tickets so future uploads of the same barcode/seat are caught by venue-verify
          if (ticketDoc.barcode) {
            try {
              await addDoc(collection(firestore, "mock_tickets"), {
                barcode: ticketDoc.barcode,
                artistName: ticketDoc.artist,
                venueName: ticketDoc.venue,
                eventDate: ticketDoc.date,
                eventTime: ticketDoc.time,
                section: ticketDoc.section,
                row: ticketDoc.row,
                seat: ticketDoc.seat,
                seatType: ticketDoc.isStanding ? "standing" : "seated",
                originalPrice: ticketDoc.originalPrice || ticketDoc.askingPrice || 0,
                eventName: ticketDoc.artist,
                eventId: ticketDoc.eventId || "",
                createdAt: serverTimestamp(),
              });
            } catch (err) {
              console.warn("Failed to add ticket to mock_tickets:", err);
            }
          }

          // Track verification results
          publishedCount++;
          if (verificationResult.status === "verified") {
            verifiedCount++;
          } else if (verificationResult.status === "needs_review") {
            needsReviewCount++;
          } else if (verificationResult.status === "rejected") {
            rejectedCount++;
          }

          // Track if event is missing
          if (!eventId) {
            skippedCount++;
          }
        }
      }

      console.log(
        `Successfully processed ${publishedCount} tickets: ${verifiedCount} verified, ${needsReviewCount} needs review, ${rejectedCount} rejected`,
      );
      setIsPublishing(false);

      // Clear previous messages
      setPublishError(null);
      setPublishSuccess(null);
      setPublishWarning(null);

      // Build message based on verification results
      // RED ERROR: If ALL tickets are rejected, show error message
      if (rejectedCount > 0 && verifiedCount === 0 && needsReviewCount === 0) {
        let errorMessage = `❌ ${rejectedCount} כרטיסים נדחו\n\n`;
        errorMessage += `הכרטיסים לא תואמים למאגר האולמות.\n`;
        errorMessage += `אנא בדוק את הפרטים ונסה שוב.\n`;
        errorMessage += `ניתן לראות את הסיבות בעמוד "הכרטיסים שלי".\n\n`;
        setPublishError(errorMessage.trim());
        setIsPublishing(false);
        return false;
      }

      // GREEN SUCCESS: Only verified tickets (auto-approved)
      if (verifiedCount > 0 && needsReviewCount === 0 && rejectedCount === 0) {
        let successMessage = `✅ ${verifiedCount} כרטיסים אומתו ופורסמו!\n\n`;
        successMessage += `הכרטיסים אושרו אוטומטית על ידי מערכת האימות של האולם\n`;
        successMessage += `והם כעת זמינים למכירה באתר.\n\n`;
        setPublishSuccess(successMessage.trim());
        setIsPublishing(false);
        return true;
      }

      // ORANGE WARNING: Has needs_review tickets (or mixed results)
      if (needsReviewCount > 0 || rejectedCount > 0) {
        let warningMessage = "";

        if (verifiedCount > 0) {
          warningMessage += ` ${verifiedCount} כרטיסים אומתו בהצלחה ופורסמו \n\n`;
        }

        if (needsReviewCount > 0) {
          warningMessage += ` ${needsReviewCount} כרטיסים ממתינים לאישור\n\n`;
          warningMessage += `הכרטיסים לא תואמים במלואם למאגר האולם.\n`;
          warningMessage += `הצוות שלנו יבדוק את הכרטיסים תוך 2-4 שעות.\n`;
          warningMessage += `תוכל לעקוב אחרי הסטטוס בעמוד "הכרטיסים שלי".\n\n`;
        }

        if (rejectedCount > 0) {
          warningMessage += ` ${rejectedCount} כרטיסים נדחו\n\n`;
          warningMessage += `חלק מהכרטיסים לא תואמים למאגר האולמות.\n`;
          warningMessage += `ניתן לראות את הסיבות בעמוד "הכרטיסים שלי".\n\n`;
        }

        setPublishWarning(warningMessage.trim());
        setIsPublishing(false);
        return true;
      }

      // Default success (shouldn't reach here, but just in case)
      setPublishSuccess("הכרטיסים פורסמו בהצלחה!");
      setIsPublishing(false);
      return true;
    } catch (error) {
      console.error("Error publishing tickets:", error);
      setPublishError(
        `שגיאה בפרסום הכרטיסים: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      setIsPublishing(false);
      return false;
    }
  };

  // Define steps as objects containing heading, description, and content
  const steps = [
    {
      heading: "העלה את הכרטיס שלך למכירה",
      description: "בחר אחת מהדרכים",
      height: "h-auto max-h-[92vh]",
      width: "w-[95vw] max-w-[880px] sm:w-[880px]",
      content: (
        <StepOneUploadTicket
          nextStep={nextStep}
          ticketData={ticketData}
          updateTicketData={updateTicketData}
        />
      ),
    },
    {
      heading: "תמחר את הכרטיס שלך",
      description: "ציין את המחיר המבוקש",
      height: "h-auto max-h-[92vh]",
      width: "w-[95vw] max-w-[880px] sm:w-[880px]",
      content: (
        <StepTwoUploadTicket
          nextStep={nextStep}
          prevStep={prevStep}
          ticketData={ticketData}
          updateTicketData={updateTicketData}
        />
      ),
    },
    {
      heading: "אשר את הפרטים",
      description: "בדוק את פרטי הכרטיס לפני הפרסום",
      height: "h-auto max-h-[92vh]",
      width: "w-[95vw] max-w-[880px] sm:w-[880px]",
      content: (
        <StepThreeUploadTicket
          nextStep={nextStep}
          prevStep={prevStep}
          ticketData={ticketData}
          updateTicketData={updateTicketData}
          saveAndAddAnother={saveAndAddAnother}
          proceedToReview={proceedToReview}
        />
      ),
    },
    {
      heading: "פרטי תשלום",
      description: "הזן את פרטי חשבון הבנק לקבלת תשלום",
      height: "h-auto max-h-[92vh]",
      width: "w-[95vw] max-w-[880px] sm:w-[880px]",
      content: (
        <StepFourBankDetails
          nextStep={nextStep}
          prevStep={prevStep}
        />
      ),
    },
    {
      heading: "סקירה סופית ופרסום",
      description: `${savedTickets.length} כרטיסים מוכנים לפרסום`,
      height: "h-auto max-h-[92vh]",
      width: "w-[95vw] max-w-[880px] sm:w-[880px]",
      content: (
        <StepFiveUploadTicket
          savedTickets={savedTickets}
          publishAllTickets={publishAllTickets}
          isPublishing={isPublishing}
          publishError={publishError}
          publishSuccess={publishSuccess}
          publishWarning={publishWarning}
          handleClose={handleClose}
          prevStep={prevStep}
          canSplit={canSplit}
          setCanSplit={setCanSplit}
        />
      ),
    },
  ];

  return (
    <>
      <AdjustableDialog
        isOpen={isOpen}
        onClose={onClose}
        height={steps[step - 1].height}
        width={steps[step - 1].width}
        heading={steps[step - 1].heading}
        description={steps[step - 1].description}
        topChildren={
          <ProgressBar
            step={bankStepSkipped && step === 5 ? 4 : step}
            totalSteps={bankStepSkipped ? 4 : 5}
          />
        }
      >
        {isTransitioning ? (
          <div className="flex items-center justify-center py-24">
            <div className="loading loading-spinner loading-lg text-primary"></div>
          </div>
        ) : (
          steps[step - 1].content
        )}
      </AdjustableDialog>

      <AuthDialog
        isOpen={showAuthDialog}
        onClose={handleAuthClose}
        initialMode="login"
      />
    </>
  );
};

export default UploadTicketDialog;
