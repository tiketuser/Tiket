export interface UploadTicketInterface {
    nextStep?: () => void;
    prevStep?: () => void;
    ticketData?: TicketData;
    updateTicketData?: (updates: Partial<TicketData>) => void;
}

export interface TicketData {
    id?: string;
    uploadedFile?: File | null;
    extractedText?: string;
    ticketDetails?: {
        title?: string;
        artist?: string;
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