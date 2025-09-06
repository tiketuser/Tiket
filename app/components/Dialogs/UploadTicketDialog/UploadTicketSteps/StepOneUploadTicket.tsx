import Image from "next/image";
import { useState, useRef } from "react";

import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";

import EmptyImage from "../../../../../public/images/Dialogs/emptyimage.svg"

const StepOneUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    ticketData,
    updateTicketData
}) => {
    const [uploadStatus, setUploadStatus] = useState<string>("לא זוהה קובץ");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [barcode, setBarcode] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processWithOCR = async (file: File) => {
        if (!updateTicketData) return;
        
        setUploadStatus("מעבד קובץ...");
        updateTicketData({ isProcessing: true, extractionError: undefined });

        try {
            // Create FormData for OCR.Space API
            const formData = new FormData();
            formData.append('file', file);
            formData.append('language', 'heb'); // Hebrew language
            formData.append('isOverlayRequired', 'false');
            formData.append('detectOrientation', 'true');
            formData.append('isTable', 'true');

            // Call OCR.Space API (using free tier)
            const response = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                headers: {
                    'apikey': 'helloworld', // Free tier API key
                },
                body: formData
            });

            const result = await response.json();

            if (result.ParsedResults && result.ParsedResults[0]) {
                const extractedText = result.ParsedResults[0].ParsedText;
                
                // Parse ticket details from extracted text
                const ticketDetails = parseTicketDetails(extractedText);
                
                updateTicketData({
                    extractedText,
                    ticketDetails,
                    isProcessing: false
                });
                
                setUploadStatus("קובץ עובד בהצלחה!");
            } else {
                throw new Error("לא ניתן לחלץ טקסט מהתמונה");
            }
        } catch (error) {
            console.error('OCR Error:', error);
            updateTicketData({
                isProcessing: false,
                extractionError: "שגיאה בעיבוד התמונה. נסה שוב."
            });
            setUploadStatus("שגיאה בעיבוד");
        }
    };

    const parseTicketDetails = (text: string) => {
        // Enhanced parsing logic for Hebrew ticket details
        const details: any = {};
        
        // Common patterns for ticket information
        const patterns = {
            // Date patterns
            date: /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})|(\d{1,2}\s+\w+\s+\d{2,4})/i,
            // Time patterns  
            time: /(\d{1,2}:\d{2})/,
            // Price patterns
            price: /₪?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*₪?/,
            // Seat patterns
            seat: /(מקום|כיסא|מושב)\s*:?\s*(\d+)/i,
            row: /(שורה|רו|row)\s*:?\s*(\w+)/i,
            section: /(יציע|אזור|section)\s*:?\s*(\w+)/i,
        };

        // Extract date
        const dateMatch = text.match(patterns.date);
        if (dateMatch) details.date = dateMatch[0];

        // Extract time
        const timeMatch = text.match(patterns.time);
        if (timeMatch) details.time = timeMatch[0];

        // Extract price
        const priceMatch = text.match(patterns.price);
        if (priceMatch) details.originalPrice = parseFloat(priceMatch[1].replace(',', ''));

        // Extract seat info
        const seatMatch = text.match(patterns.seat);
        if (seatMatch) details.seat = seatMatch[2];

        const rowMatch = text.match(patterns.row);
        if (rowMatch) details.row = rowMatch[2];

        const sectionMatch = text.match(patterns.section);
        if (sectionMatch) details.section = sectionMatch[2];

        // Try to extract artist/title (usually the largest text or first lines)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0) {
            details.title = lines[0].trim();
            if (lines.length > 1) details.artist = lines[1].trim();
        }

        return details;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !updateTicketData) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadStatus("יש לבחור קובץ תמונה");
            return;
        }

        // Update ticket data with uploaded file
        updateTicketData({ uploadedFile: file });
        
        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        
        setUploadStatus(`קובץ נבחר: ${file.name}`);
        
        // Process with OCR
        await processWithOCR(file);
    };

    const handleBarcodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setBarcode(value);
        if (updateTicketData) {
            updateTicketData({
                ticketDetails: {
                    ...ticketData?.ticketDetails,
                    barcode: value
                }
            });
        }
    };

    const canProceed = ticketData?.uploadedFile || barcode.length > 0;

    return (
        <div className="w-[668px] mt-12">

            <p className="text-heading-5-desktop font-bold">תמונת כרטיס</p>
            <p className="text-text-medium font-bold">גרור או בחר תמונה של הכרטיס מהמכשיר</p>
            <p className="text-text-medium font-light">ודא שהתמונה ברורה ושכל פרטי הכרטיס נראים היטב.</p>

            <div className="w-full flex items-center justify-between h-[140px] mt-3">

                {/* Left side: File input, label, and status text */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            id="fileUpload" 
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />

                        <button 
                            className="btn btn-secondary border-primary border-[2px] bg-white text-primary"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <label className="text-text-large font-normal cursor-pointer">
                                בחר קובץ
                            </label>
                        </button>

                        <p className={`text-text-medium font-normal ${
                            ticketData?.isProcessing ? 'text-blue-600' : 
                            ticketData?.extractionError ? 'text-red-600' : 
                            ticketData?.uploadedFile ? 'text-green-600' : 'text-gray-600'
                        }`}>
                            {uploadStatus}
                        </p>
                    </div>
                    
                    {ticketData?.isProcessing && (
                        <div className="flex items-center gap-2">
                            <div className="loading loading-spinner loading-sm"></div>
                            <span className="text-sm text-blue-600">מעבד עם OCR...</span>
                        </div>
                    )}
                </div>

                {/* Right side: Image preview */}
                <div className="w-[120px] h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {previewUrl ? (
                        <Image 
                            src={previewUrl}
                            alt="Ticket Preview" 
                            width={120}
                            height={120}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <Image 
                            src={EmptyImage}
                            alt="Placeholder" 
                            width={80}
                            height={80}
                        />
                    )}
                </div>
            </div>

            <div className="border-t-4 mt-6 border-highlight w-full"></div>

            <p className="text-heading-5-desktop font-bold mt-16">קוד ידני</p>
            <p className="text-text-medium font-bold">הכנס את קוד הברקוד שעל הכרטיס</p>
            <p className="text-text-medium font-light">ודא את המספר כמה פעמים לפני שליחה</p>

            <div className="flex items-center gap-4 mt-6">
                <CustomInput 
                    name="barcode" 
                    id="barcode" 
                    width="w-[392px]" 
                    placeholder="מספר ברקוד"
                    value={barcode}
                    onChange={handleBarcodeChange}
                />

                <button 
                    className="btn btn-secondary border-primary border-[2px] bg-white text-primary"
                    onClick={() => {
                        if (barcode && updateTicketData) {
                            updateTicketData({
                                ticketDetails: {
                                    ...ticketData?.ticketDetails,
                                    barcode: barcode
                                }
                            });
                        }
                    }}
                >
                    <label className="text-text-large font-normal">
                        העלה כרטיס
                    </label>
                </button> 
            </div>

            <div className="border-t-4 mt-6 border-highlight w-full shadow-2xl"/>

            <button 
                id="nextStep"
                className={`btn w-[456px] h-[48px] min-h-0 btn-secondary text-text-large font-normal mt-12 mx-auto block ${
                    canProceed && !ticketData?.isProcessing
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-secondary text-white cursor-not-allowed'
                }`}
                onClick={() => {
                    if (canProceed && !ticketData?.isProcessing && nextStep) {
                        nextStep();
                    }
                }}
                disabled={!canProceed || ticketData?.isProcessing}
            >
                {ticketData?.isProcessing ? 'מעבד...' : 'לשלב הבא'}
            </button>
        </div>
    );
};

export default StepOneUploadTicket;