export interface UploadTicketInterface {
    nextStep?: () => void;
    prevStep?: () => void;
    ticketData?: TicketData;
    updateTicketData?: (updates: Partial<TicketData>) => void;
    saveAndAddAnother?: () => void;
    proceedToReview?: () => void;
    savedTickets?: TicketData[];
    publishAllTickets?: () => Promise<boolean>;
    isPublishing?: boolean;
}

export interface TicketData {
    id?: string;
    uploadedFile?: File | null;
    extractedText?: string;
    ticketDetails?: {
        title?: string;
        artist?: string;
        category?: string; // Event category: מוזיקה, תיאטרון, סטנדאפ, ילדים, ספורט
        venue?: string;
        date?: string;
        time?: string;
        seatLocation?: string;
        section?: string;
        row?: string;
        seat?: string;
        barcode?: string;
        originalPrice?: number;
        price?: number; // Extracted price from OCR
        isStanding?: boolean; // Standing ticket (no seat assignment)
    };
    pricing?: {
        askingPrice?: number;
        allowPriceSuggestions?: boolean;
        minPrice?: number;
        maxPrice?: number;
    };
    isProcessing?: boolean;
    extractionError?: string;
}