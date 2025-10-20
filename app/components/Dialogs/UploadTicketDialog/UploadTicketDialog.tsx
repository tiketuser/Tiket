"use client";

import { useState } from "react";
import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import ProgressBar from "../ProgressBar/ProgressBar";

import StepOneUploadTicket from "./UploadTicketSteps/StepOneUploadTicket";
import StepTwoUploadTicket from "./UploadTicketSteps/StepTwoUploadTicket";
import StepThreeUploadTicket from "./UploadTicketSteps/StepThreeUploadTicket";
import StepFourUploadTicket from "./UploadTicketSteps/StepFourUploadTicket";
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
  const [savedTickets, setSavedTickets] = useState<TicketData[]>([]); // Store multiple tickets
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Save current ticket and add another
  const saveAndAddAnother = () => {
    // Save current ticket to the list
    setSavedTickets((prev) => [...prev, ticketData]);
    // Reset current ticket data
    setTicketData({});
    // Go back to step 1
    setStep(1);
  };

  // Move to step 4 (final review) with current ticket
  const proceedToReview = () => {
    // Save current ticket to the list
    setSavedTickets((prev) => [...prev, ticketData]);
    // Move to step 4
    setStep(4);
  };

  // Enhanced nextStep function
  const nextStep = async () => {
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

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
    onClose();
  };

  // Find or create concert, then publish tickets
  const publishAllTickets = async () => {
    console.log("publishAllTickets called, savedTickets:", savedTickets);

    if (!db) {
      console.error("Firebase not initialized:", { db });
      setPublishError("מסד הנתונים לא זמין כרגע");
      alert("מסד הנתונים לא זמין כרגע");
      return false;
    }

    const firestore = db;
    setIsPublishing(true);
    setPublishError(null);

    try {
      console.log(`Starting to publish ${savedTickets.length} tickets`);
      let publishedCount = 0;
      let skippedCount = 0;

      // Group tickets by concert (artist + date + venue)
      const ticketsByConcert = new Map<string, typeof savedTickets>();

      for (const ticket of savedTickets) {
        const concertKey = `${ticket.ticketDetails?.artist}-${ticket.ticketDetails?.date}-${ticket.ticketDetails?.venue}`;
        if (!ticketsByConcert.has(concertKey)) {
          ticketsByConcert.set(concertKey, []);
        }
        ticketsByConcert.get(concertKey)?.push(ticket);
      }

      console.log(`Found ${ticketsByConcert.size} unique concerts`);

      // Process each concert group
      for (const [concertKey, tickets] of ticketsByConcert) {
        const firstTicket = tickets[0];
        const artist = firstTicket.ticketDetails?.artist || "";
        const date = firstTicket.ticketDetails?.date || "";
        const venue = firstTicket.ticketDetails?.venue || "";
        const time = firstTicket.ticketDetails?.time || "";

        console.log(`Processing concert: ${artist} on ${date} at ${venue}`);

        // Normalize strings for better matching
        const normalizeString = (str: string) =>
          str.trim().toLowerCase().replace(/\s+/g, " ");

        // Normalize date to dd/mm/yyyy format
        const normalizeDate = (dateStr: string): string => {
          // If already in dd/mm/yyyy format, return as is
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            return dateStr;
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

        // Fetch all concerts and do flexible matching (case-insensitive)
        // This avoids Firestore case-sensitive query limitations
        console.log("Fetching all concerts for flexible matching...");

        const allConcertsQuery = query(collection(firestore, "concerts"));
        const allConcerts = await getDocs(allConcertsQuery);

        const matchingConcerts = allConcerts.docs.filter((doc) => {
          const data = doc.data();
          const concertArtist = data.artist || "";
          const concertVenue = normalizeString(data.venue || "");
          const concertDate = normalizeDate(data.date || "");

          // Use smart artist matching (handles Hebrew/English variations)
          const artistMatch = artistNamesMatch(artist, concertArtist);
          const venueMatch = concertVenue === normalizedVenue;
          const dateMatch = concertDate === normalizedDate;

          console.log(`Comparing with concert ${doc.id}:`, {
            ticketArtist: artist,
            concertArtist: concertArtist,
            artistMatch,
            venueMatch: `"${concertVenue}" === "${normalizedVenue}" = ${venueMatch}`,
            dateMatch: `"${concertDate}" === "${normalizedDate}" = ${dateMatch}`,
          });

          return artistMatch && venueMatch && dateMatch;
        });

        let concertsSnapshot = {
          empty: matchingConcerts.length === 0,
          docs: matchingConcerts,
        } as any;

        if (matchingConcerts.length > 0) {
          console.log(
            `✅ Found ${matchingConcerts.length} matching concert(s) via flexible search`
          );
        } else {
          console.log("❌ No matching concerts found");
        }

        let concertId: string | null = null;

        if (!concertsSnapshot.empty) {
          // Concert exists, use existing ID
          concertId = concertsSnapshot.docs[0].id;
          console.log(`Found existing concert with ID: ${concertId}`);
        } else {
          // No matching concert found - tickets will be marked as pending
          console.log(
            "Concert not found, tickets will be marked as pending..."
          );
        }

        // Now publish all tickets for this concert
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          console.log(
            `Publishing ticket ${i + 1}/${tickets.length} for concert ${
              concertId || "pending"
            }`
          );

          // Convert uploaded image to base64 for storage
          let ticketImageBase64 = null;
          if (ticket.uploadedFile) {
            try {
              const reader = new FileReader();
              ticketImageBase64 = await new Promise<string>(
                (resolve, reject) => {
                  reader.onloadend = () => {
                    if (typeof reader.result === "string") {
                      resolve(reader.result);
                    } else {
                      reject(new Error("Failed to read file"));
                    }
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(ticket.uploadedFile as File);
                }
              );
              console.log("✅ Converted ticket image to base64");
            } catch (error) {
              console.warn("Failed to convert ticket image:", error);
            }
          }

          const ticketDoc = {
            concertId: concertId || null, // null if no matching concert
            artist: ticket.ticketDetails?.artist || "",
            date: normalizedDate, // Use normalized date format
            time: ticket.ticketDetails?.time || "",
            venue: ticket.ticketDetails?.venue || "",
            section: ticket.ticketDetails?.section || "",
            row: ticket.ticketDetails?.row || "",
            seat: ticket.ticketDetails?.seat || "",
            isStanding: ticket.ticketDetails?.isStanding || false,
            askingPrice: ticket.pricing?.askingPrice,
            originalPrice: ticket.ticketDetails?.originalPrice || null,
            allowPriceSuggestions:
              ticket.pricing?.allowPriceSuggestions || false,
            minPrice: ticket.pricing?.minPrice || null,
            maxPrice: ticket.pricing?.maxPrice || null,
            extractedText: ticket.extractedText || null,
            ticketImage: ticketImageBase64, // Store uploaded ticket image
            status: "pending_approval", // ALL tickets need manual approval
            createdAt: serverTimestamp(),
            sellerId: "anonymous",
          };

          const ticketRef = await addDoc(
            collection(firestore, "tickets"),
            ticketDoc
          );
          console.log(
            `✅ Ticket saved with ID: ${ticketRef.id}, status: ${ticketDoc.status}, concertId: ${ticketDoc.concertId}`
          );
          console.log("Ticket data:", ticketDoc);

          // All tickets are pending approval now
          publishedCount++;

          // Track if concert is missing
          if (!concertId) {
            skippedCount++;
          }
        }
      }

      const pendingMessage =
        skippedCount > 0
          ? `\n\n⚠️ ${skippedCount} כרטיסים ללא קונצרט מתאים (יש ליצור קונצרט)`
          : "";

      console.log(
        `Successfully saved ${publishedCount} tickets for approval, ${skippedCount} without matching concert`
      );
      setIsPublishing(false);

      // Inform seller that tickets need admin approval
      alert(
        `✅ הכרטיסים נשלחו בהצלחה!\n\n⏳ הכרטיסים יפורסמו לאחר אישור המנהל\n\nנודיע לך ברגע שהכרטיסים יאושרו${pendingMessage}`
      );
      handleClose();
      return true;
    } catch (error) {
      console.error("Error publishing tickets:", error);
      setPublishError(
        `שגיאה בפרסום הכרטיסים: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      alert(
        `שגיאה בפרסום הכרטיסים: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
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
      height: "h-[90vh] max-h-[912px] sm:h-[912px]",
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
      height: "h-[90vh] max-h-[704px] sm:h-[704px]",
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
      height: "h-[120vh] max-h-auto sm:h-auto",
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
      heading: "סקירה סופית ופרסום",
      description: `${savedTickets.length} כרטיסים מוכנים לפרסום`,
      height: "h-[90vh] max-h-[900px] sm:h-auto",
      width: "w-[95vw] max-w-[880px] sm:w-[880px]",
      content: (
        <StepFourUploadTicket
          savedTickets={savedTickets}
          publishAllTickets={publishAllTickets}
          isPublishing={isPublishing}
          prevStep={prevStep}
        />
      ),
    },
  ];

  return (
    <AdjustableDialog
      isOpen={isOpen}
      onClose={onClose}
      height={steps[step - 1].height}
      width={steps[step - 1].width}
      heading={steps[step - 1].heading} // Dynamically change heading
      description={steps[step - 1].description} // Dynamically change description
      topChildren={<ProgressBar step={step} />}
    >
      {steps[step - 1].content}
    </AdjustableDialog>
  );
};

export default UploadTicketDialog;
