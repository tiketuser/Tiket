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
import { collection, query, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../../firebase";
import { artistNamesMatch } from "../../../../utils/artistMatcher";
import { apiFetch } from "@/lib/platform";

interface UploadTicketInterface {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Normalization helpers for event matching ───────────────────────────────

const HEBREW_MONTHS: Record<string, string> = {
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

const ENGLISH_MONTHS: Record<string, string> = {
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

const normalizeString = (str: string) =>
  str.trim().toLowerCase().replace(/\s+/g, " ");

// Normalize assorted OCR date formats ("6.8.25", "06 DEC", "6 בדצמבר") to dd/mm/yyyy
function normalizeDate(dateStr: string): string {
  const normalized = dateStr.replace(/\./g, "/");
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
    const [d, m, y] = normalized.split("/");
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  const parts = dateStr.trim().split(/[\s/\-.]+/);
  if (parts.length >= 2) {
    const day = parts[0].padStart(2, "0");
    const monthKey = parts[1].toLowerCase();
    const month =
      HEBREW_MONTHS[monthKey] || ENGLISH_MONTHS[monthKey.substring(0, 3)];
    const year = parts[2] || new Date().getFullYear().toString();
    if (month) return `${day}/${month}/${year}`;
  }
  return dateStr;
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
    const dataToSave = updatedTicketData || ticketData;
    setSavedTickets((prev) => [...prev, dataToSave]);
    setTicketData({});
    setStep(1);
  };

  // Check if user has bank details configured, then go to the right step
  const goToNextAfterTicket = useCallback(async (dataToSave: TicketData) => {
    setSavedTickets((prev) => [...prev, dataToSave]);
    setIsTransitioning(true);
    try {
      const idToken = await getAuth().currentUser!.getIdToken();
      const res = await apiFetch("/api/seller/payment-details", {
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

  const updateTicketData = (updates: Partial<TicketData>) => {
    setTicketData((prev) => ({ ...prev, ...updates }));
  };

  // Reset dialog state when closing (also wired to the dialog's X button so a
  // mid-flow close never leaves stale tickets behind for the next open)
  const handleClose = () => {
    setStep(1);
    setTicketData({});
    setSavedTickets([]);
    setIsPublishing(false);
    setPublishError(null);
    setPublishSuccess(null);
    setPublishWarning(null);
    setCanSplit(true);
    setShowAuthDialog(false);
    setBankStepSkipped(false);
    pendingProceedData.current = null;
    onClose();
  };

  /**
   * Publish every saved ticket through the server-authoritative
   * /api/create-ticket route. The server re-runs venue verification, enforces
   * barcode uniqueness in a transaction (409 on duplicates) and decides each
   * ticket's status — so no client-side pre-checks are needed here.
   */
  const publishAllTickets = async () => {
    if (!db) {
      setPublishError("מסד הנתונים לא זמין כרגע");
      return false;
    }
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      setPublishError("יש להתחבר לחשבון כדי לפרסם כרטיסים");
      return false;
    }
    const firestore = db;

    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);
    setPublishWarning(null);

    try {
      const authToken = await currentUser.getIdToken();

      // Group tickets by event (artist + date + venue) so each group shares
      // an eventId and, when it holds 2+ tickets, a bundleId
      const ticketsByEvent = new Map<string, TicketData[]>();
      for (const ticket of savedTickets) {
        const d = ticket.ticketDetails;
        const key = `${d?.artist}-${d?.date}-${d?.venue}`;
        const group = ticketsByEvent.get(key);
        if (group) group.push(ticket);
        else ticketsByEvent.set(key, [ticket]);
      }

      // Fetch all events once and match in code — Firestore queries are
      // case-sensitive, so flexible matching can't be done in the query
      const allEvents = await getDocs(query(collection(firestore, "events")));

      let verifiedCount = 0;
      let needsReviewCount = 0;
      let rejectedCount = 0;
      let duplicateCount = 0;

      for (const tickets of ticketsByEvent.values()) {
        const first = tickets[0].ticketDetails;
        const artist = first?.artist || "";
        const normalizedVenue = normalizeString(first?.venue || "");
        const normalizedDate = normalizeDate(first?.date || "");

        const matchedEvent = allEvents.docs.find((doc) => {
          const data = doc.data();
          const eventVenue = normalizeString(data.venue || "");
          return (
            artistNamesMatch(artist, data.artist || "") &&
            // Venue: partial match — one must contain the other
            // (handles "היכל מנורה" vs "היכל מנורה מבטחים")
            (eventVenue === normalizedVenue ||
              eventVenue.includes(normalizedVenue) ||
              normalizedVenue.includes(eventVenue)) &&
            normalizeDate(data.date || "") === normalizedDate
          );
        });
        // No matching event → the ticket is created without an eventId and
        // waits in admin review until the event is added
        const eventId = matchedEvent?.id || null;

        const bundleId = tickets.length > 1 ? crypto.randomUUID() : null;

        for (const ticket of tickets) {
          // Upload the ticket image so admin review has the actual ticket
          let ticketImageUrl: string | null = null;
          if (ticket.uploadedFile) {
            try {
              const uploadFormData = new FormData();
              uploadFormData.append("file", ticket.uploadedFile);
              const uploadRes = await apiFetch("/api/upload-ticket-image", {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
                body: uploadFormData,
              });
              if (uploadRes.ok) {
                ticketImageUrl = (await uploadRes.json()).imageUrl ?? null;
              } else {
                console.warn("Ticket image upload failed:", uploadRes.status);
              }
            } catch (error) {
              console.warn("Ticket image upload failed:", error);
            }
          }

          const createRes = await apiFetch("/api/create-ticket", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              ticket: {
                eventId,
                artist,
                category: ticket.ticketDetails?.category || "מוזיקה",
                date: normalizedDate,
                time: ticket.ticketDetails?.time || "",
                venue: ticket.ticketDetails?.venue || "",
                section: ticket.ticketDetails?.section || "",
                block: ticket.ticketDetails?.block || "",
                row: ticket.ticketDetails?.row || "",
                seat: ticket.ticketDetails?.seat || "",
                barcode: ticket.ticketDetails?.barcode || null,
                isStanding: ticket.ticketDetails?.isStanding || false,
                askingPrice: ticket.pricing?.askingPrice,
                originalPrice: ticket.ticketDetails?.originalPrice || null,
                allowPriceSuggestions:
                  ticket.pricing?.allowPriceSuggestions || false,
                minPrice: ticket.pricing?.minPrice || null,
                maxPrice: ticket.pricing?.maxPrice || null,
                ticketImage: ticketImageUrl,
                eventName: artist,
                bundleId,
                canSplit: bundleId !== null ? canSplit : null,
                bundleSize: bundleId !== null ? tickets.length : null,
              },
            }),
          });

          if (createRes.status === 409) {
            // Duplicate barcode — the server refused to double-list it
            duplicateCount++;
            rejectedCount++;
            continue;
          }
          if (!createRes.ok) {
            throw new Error(`create-ticket failed: ${createRes.status}`);
          }

          const created = await createRes.json();
          if (created.verificationStatus === "verified") verifiedCount++;
          else if (created.verificationStatus === "rejected") rejectedCount++;
          else needsReviewCount++;
        }
      }

      const duplicateNote =
        duplicateCount > 0
          ? `${duplicateCount} כרטיסים לא פורסמו כי הברקוד שלהם כבר קיים במערכת.\n`
          : "";

      // RED ERROR: all tickets rejected
      if (rejectedCount > 0 && verifiedCount === 0 && needsReviewCount === 0) {
        setPublishError(
          `❌ ${rejectedCount} כרטיסים נדחו\n\n` +
            duplicateNote +
            `הכרטיסים לא תואמים למאגר האולמות.\n` +
            `אנא בדוק את הפרטים ונסה שוב.\n` +
            `ניתן לראות את הסיבות בעמוד "הכרטיסים שלי".`,
        );
        return false;
      }

      // GREEN SUCCESS: everything auto-verified
      if (verifiedCount > 0 && needsReviewCount === 0 && rejectedCount === 0) {
        setPublishSuccess(
          `✅ ${verifiedCount} כרטיסים אומתו ופורסמו!\n\n` +
            `הכרטיסים אושרו אוטומטית על ידי מערכת האימות של האולם\n` +
            `והם כעת זמינים למכירה באתר.`,
        );
        return true;
      }

      // ORANGE WARNING: pending review / mixed results
      let warningMessage = "";
      if (verifiedCount > 0) {
        warningMessage += `${verifiedCount} כרטיסים אומתו בהצלחה ופורסמו\n\n`;
      }
      if (needsReviewCount > 0) {
        warningMessage += `${needsReviewCount} כרטיסים ממתינים לאישור\n\n`;
        warningMessage += `הכרטיסים לא תואמים במלואם למאגר האולם.\n`;
        warningMessage += `הצוות שלנו יבדוק את הכרטיסים תוך 2-4 שעות.\n`;
        warningMessage += `תוכל לעקוב אחרי הסטטוס בעמוד "הכרטיסים שלי".\n\n`;
      }
      if (rejectedCount > 0) {
        warningMessage += `${rejectedCount} כרטיסים נדחו\n\n`;
        warningMessage += duplicateNote;
        warningMessage += `ניתן לראות את הסיבות בעמוד "הכרטיסים שלי".`;
      }

      if (warningMessage) {
        setPublishWarning(warningMessage.trim());
      } else {
        setPublishSuccess("הכרטיסים פורסמו בהצלחה!");
      }
      return true;
    } catch (error) {
      console.error("Error publishing tickets:", error);
      setPublishError(
        `שגיאה בפרסום הכרטיסים: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return false;
    } finally {
      setIsPublishing(false);
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
        onClose={handleClose}
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
