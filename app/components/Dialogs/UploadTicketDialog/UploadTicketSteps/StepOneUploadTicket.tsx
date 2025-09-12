'use client';

import Image from "next/image";
import { useState, useRef } from "react";
import Tesseract from 'tesseract.js';

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
    const workerRef = useRef<Tesseract.Worker | null>(null);
    const isProcessingRef = useRef<boolean>(false);

    const processWithOCR = async (file: File) => {
        if (!updateTicketData) return;
        
        setUploadStatus("מכין מנוע OCR...");
        updateTicketData({ isProcessing: true, extractionError: undefined });

        try {
            isProcessingRef.current = true;
            
            // Initialize Tesseract worker with Hebrew and English support
            setUploadStatus("מעביר תמונה לעיבוד...");
            
            const worker = await Tesseract.createWorker(['heb', 'eng'], 1, {
                logger: (m) => {
                    if (!isProcessingRef.current) return; // Don't update if cancelled
                    console.log('OCR Progress:', m);
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        setUploadStatus(`מזהה טקסט... ${progress}%`);
                    } else if (m.status === 'loading language traineddata') {
                        setUploadStatus('טוען מודל זיהוי עברית...');
                    } else if (m.status === 'initializing tesseract') {
                        setUploadStatus('מכין מנוע OCR...');
                    }
                }
            });

            workerRef.current = worker;

            // Check if processing was cancelled
            if (!isProcessingRef.current) {
                await worker.terminate();
                return;
            }

            // Configure Tesseract for better accuracy
            await worker.setParameters({
                tessedit_page_seg_mode: '6', // Uniform block of text
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789אבגדהוזחטיכךלמםנןסעפףצץקרשת .,:-₪/',
                preserve_interword_spaces: '1'
            });

            setUploadStatus('מתחיל זיהוי תוכן...');

            // Process the image with Tesseract.js
            const { data: { text, confidence } } = await worker.recognize(file);
            
            // Check again if processing was cancelled after recognition
            if (!isProcessingRef.current) {
                await worker.terminate();
                return;
            }
            
            console.log('Tesseract OCR Result:', { text, confidence });
            let extractedText = text.trim();

            // If Tesseract didn't extract good text, still proceed to manual entry
            if (extractedText && confidence > 30) { // Only use result if confidence is reasonable
                const ticketDetails = parseTicketDetails(extractedText);
                
                setUploadStatus('מנתח אותנטיות עם AI...');
                
                // Perform simple authenticity analysis
                const authenticityAnalysis = await analyzeTicketAuthenticity({
                    barcode_data: barcode || ticketDetails.barcode || '',
                    ocr_data: {
                        extracted_text: extractedText,
                        currency_detected: detectCurrency(extractedText),
                        confidence: Math.round(confidence)
                    }
                });
                
                // Show both OCR and authenticity analysis in alert
                const completeResult = {
                    ocrAnalysis: {
                        confidence: Math.round(confidence),
                        rawText: extractedText,
                        extractedDetails: ticketDetails
                    },
                    authenticityAnalysis: authenticityAnalysis
                };
                
                alert("ניתוח מלא של הכרטיס:\n\n" + JSON.stringify(completeResult, null, 2));
                
                updateTicketData({
                    extractedText,
                    ticketDetails: {
                        ...ticketDetails,
                        authenticityScore: authenticityAnalysis.authenticity_score,
                        analysisFlags: authenticityAnalysis.risk_flags,
                        currencyDetected: authenticityAnalysis.currency
                    },
                    isProcessing: false
                });
                
                setUploadStatus(`ניתוח הושלם! (OCR: ${Math.round(confidence)}%, אותנטיות: ${authenticityAnalysis.authenticity_score}%)`);
                
                // Auto-advance to next step after successful analysis
                setTimeout(() => {
                    if (nextStep) {
                        nextStep();
                    }
                }, 1500);
            } else {
                // If OCR didn't work well, set up for manual entry
                console.log(`OCR confidence too low (${Math.round(confidence)}%) or no text found`);
                updateTicketData({
                    isProcessing: false,
                    ticketDetails: {
                        title: "",
                        artist: "",
                        date: "",
                        time: "",
                        venue: "",
                        seat: "",
                        row: "",
                        section: "",
                        barcode: "",
                        originalPrice: undefined
                    },
                    extractionError: "איכות הטקסט נמוכה - מעבר למילוי ידני"
                });
                setUploadStatus("תמונה הועלתה - מלא פרטים ידנית");
                return;
            }
        } catch (error) {
            console.error('Tesseract OCR Error:', error);
            
            // Provide helpful error message
            let errorMessage = "מעבר למילוי ידני";
            if (error instanceof Error) {
                if (error.message.includes('loading')) {
                    errorMessage = "טעינת מודל OCR נכשלה - מעבר למילוי ידני";
                } else if (error.message.includes('recognize')) {
                    errorMessage = "זיהוי הטקסט נכשל - מעבר למילוי ידני";
                }
            }
            
            // Set basic empty details for manual entry
            updateTicketData({
                isProcessing: false,
                ticketDetails: {
                    title: "",
                    artist: "",
                    date: "",
                    time: "",
                    venue: "",
                    seat: "",
                    row: "",
                    section: "",
                    barcode: "",
                    originalPrice: undefined
                },
                extractionError: errorMessage
            });
            setUploadStatus("תמונה הועלתה - מלא פרטים ידנית");
        } finally {
            // Always cleanup the worker
            isProcessingRef.current = false;
            if (workerRef.current) {
                try {
                    await workerRef.current.terminate();
                    workerRef.current = null;
                } catch (e) {
                    console.log('Worker cleanup failed:', e);
                }
            }
        }
    };

    // Helper function to detect currency from text
    const detectCurrency = (text: string): string => {
        if (text.includes('₪') || text.includes('ILS')) return 'שקל ישראלי';
        if (text.includes('$') || text.includes('USD')) return 'דולר אמריקאי';
        if (text.includes('€') || text.includes('EUR')) return 'יורו';
        if (text.includes('£') || text.includes('GBP')) return 'ליש"ט';
        
        // Default assumption for Israeli venues/artists
        if (text.includes('ישראל') || text.includes('תל אביב') || text.includes('ירושלים') || text.includes('היכל')) {
            return 'שקל ישראלי';
        }
        
        return 'לא ידוע';
    };

    // Simple authenticity analysis
    const analyzeTicketAuthenticity = async (extractedData: any): Promise<any> => {
        try {
            const ocrText = extractedData.ocr_data?.extracted_text || '';
            const currency = extractedData.ocr_data?.currency_detected || 'לא ידוע';
            
            // Extract date from text
            const dateMatch = ocrText.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}\.\d{1,2}\.\d{4})|(\d{1,2}-\d{1,2}-\d{4})/);
            const eventDate = dateMatch ? dateMatch[0] : null;
            
            // Check if event has passed
            let status = 'valid';
            let authenticityScore = 75;
            const riskFlags: string[] = [];
            
            if (eventDate) {
                const eventTime = new Date(eventDate.replace(/\./g, '/'));
                const today = new Date();
                if (eventTime < today) {
                    status = 'expired';
                    authenticityScore = Math.min(authenticityScore, 35);
                    riskFlags.push('האירוע כבר התרחש');
                }
            }
            
            // Adjust score based on OCR confidence
            if (extractedData.ocr_data.confidence < 60) {
                authenticityScore -= 10;
                riskFlags.push('איכות זיהוי טקסט נמוכה');
            }
            
            // Check for basic ticket elements
            if (!ocrText.includes('כרטיס') && !ocrText.includes('ticket')) {
                authenticityScore -= 15;
                riskFlags.push('חסרים רכיבי כרטיס בסיסיים');
            }
            
            return {
                authenticity_score: Math.max(0, authenticityScore),
                status: status,
                currency: currency,
                event_date: eventDate,
                days_since_event: eventDate ? Math.floor((new Date().getTime() - new Date(eventDate.replace(/\./g, '/')).getTime()) / (1000 * 3600 * 24)) : null,
                price_analysis: currency === 'שקל ישראלי' ? 'מחירים סבירים לשוק הישראלי' : 'בדוק מחירים לפי מטבע מקומי',
                risk_flags: riskFlags,
                recommendations: status === 'expired' ? 'כרטיס פג תוקף - אל תקנה' : 'בדוק פרטי אירוע נוספים'
            };
        } catch (error) {
            console.error('Analysis Error:', error);
            return {
                authenticity_score: 50,
                status: 'unknown',
                currency: 'לא ידוע',
                event_date: null,
                days_since_event: null,
                price_analysis: 'ניתוח נכשל',
                risk_flags: ['שגיאה בניתוח'],
                recommendations: 'בדוק כרטיס ידנית'
            };
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
        
        // Revoke previous URL to prevent memory leaks
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        
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
        <div className="w-full max-w-[668px] mt-6 sm:mt-12 px-4 sm:px-0 mx-auto">

            <p className="text-lg sm:text-heading-5-desktop font-bold">תמונת כרטיס</p>
            <p className="text-sm sm:text-text-medium font-bold">גרור או בחר תמונה של הכרטיס מהמכשיר</p>
            <p className="text-sm sm:text-text-medium font-light">ודא שהתמונה ברורה ושכל פרטי הכרטיס נראים היטב.</p>

            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:h-[140px] mt-3">

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
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="loading loading-spinner loading-sm"></div>
                                <span className="text-sm text-blue-600">מעבד עם OCR...</span>
                            </div>
                            <button 
                                className="btn btn-sm btn-outline"
                                onClick={async () => {
                                    // Cancel any running OCR process
                                    isProcessingRef.current = false;
                                    if (workerRef.current) {
                                        try {
                                            await workerRef.current.terminate();
                                            workerRef.current = null;
                                        } catch (e) {
                                            console.log('Failed to cancel OCR:', e);
                                        }
                                    }
                                    
                                    if (updateTicketData) {
                                        updateTicketData({ isProcessing: false });
                                        setUploadStatus("מעבר למילוי ידני");
                                    }
                                }}
                            >
                                דלג על OCR
                            </button>
                        </div>
                    )}
                </div>

                {/* Right side: Image preview */}
                <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden mx-auto sm:mx-0">
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

            <p className="text-lg sm:text-heading-5-desktop font-bold mt-8 sm:mt-16">קוד ידני</p>
            <p className="text-sm sm:text-text-medium font-bold">הכנס את קוד הברקוד שעל הכרטיס</p>
            <p className="text-sm sm:text-text-medium font-light">ודא את המספר כמה פעמים לפני שליחה</p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-6">
                <CustomInput 
                    name="barcode" 
                    id="barcode" 
                    width="w-full sm:w-[392px]" 
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
                className={`btn w-full max-w-[456px] h-[48px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal mt-8 sm:mt-12 mx-auto block ${
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