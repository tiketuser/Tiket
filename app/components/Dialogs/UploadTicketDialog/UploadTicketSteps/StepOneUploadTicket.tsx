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
                
                // Show organized extracted information in alert
                const organizedInfo = `🎫 מידע שחולץ מהכרטיס:

📋 פרטי אירוע:
• שם האירוע: ${ticketDetails.title || 'לא זוהה'}
• אמן: ${ticketDetails.artist || 'לא זוהה'}
• תאריך: ${ticketDetails.date || authenticityAnalysis.event_date || 'לא זוהה'}
• שעה: ${ticketDetails.time || 'לא זוהה'}
• מקום: ${ticketDetails.venue || 'לא זוהה'}

💺 פרטי ישיבה:
• מקום: ${ticketDetails.seat || 'לא זוהה'}
• שורה: ${ticketDetails.row || 'לא זוהה'}
• יציע/אזור: ${ticketDetails.section || 'לא זוהה'}

💰 פרטי מחיר:
• מחיר מקורי: ${ticketDetails.originalPrice ? ticketDetails.originalPrice + ' ' + authenticityAnalysis.currency : 'לא זוהה'}
• מטבע: ${authenticityAnalysis.currency}

🔍 ניתוח אותנטיות:
• ציון אמינות: ${authenticityAnalysis.authenticity_score}%
• סטטוס: ${authenticityAnalysis.status}
• סיכונים: ${authenticityAnalysis.risk_flags.join(', ') || 'אין'}
• המלצה: ${authenticityAnalysis.recommendations}

📊 פרטים טכניים:
• דיוק OCR: ${Math.round(confidence)}%
• ברקוד: ${barcode || ticketDetails.barcode || 'לא זוהה'}`;
                
                alert(organizedInfo);
                
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
        console.log('Parsing OCR text:', text);
        const details: any = {};
        
        // Clean text and split into lines for better analysis
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const fullText = text.replace(/[\u200E\u200F\u202A-\u202E]/g, '').replace(/\s+/g, ' ');
        
        console.log('Text lines:', lines);
        
        // Look for Israeli venue names specifically
        const israeliVenueMatch = fullText.match(/(האצטדיון\s+הלאומי[^,\n]*)/i) ||
                                 fullText.match(/(בלומפילד[^,\n]*)/i) ||
                                 fullText.match(/(היכל\s+התרבות[^,\n]*)/i) ||
                                 fullText.match(/(לבונטין[^,\n]*)/i);
        
        if (israeliVenueMatch) {
            details.venue = israeliVenueMatch[1].trim();
            console.log('Found Israeli venue:', details.venue);
        }
        
        // Look for artist/event name in the first meaningful lines
        for (const line of lines) {
            const cleanLine = line.trim().replace(/[^\u0590-\u05FF\u0020-\u007Ea-zA-Z]/g, '');
            if (cleanLine.length > 3 && cleanLine.length < 50 && 
                !cleanLine.includes('ASE') && !cleanLine.includes('STADIUM') && 
                !cleanLine.includes('Reference') && !cleanLine.includes('Block')) {
                if (!details.artist) {
                    details.artist = cleanLine;
                    details.title = cleanLine;
                    console.log('Found artist:', cleanLine);
                    break;
                }
            }
        }
        
        // Look for date in Israeli format like "06/08/25" or similar patterns
        const israeliDatePatterns = [
            /(\d{2})\/(\d{2})\/(\d{2})/,    // 06/08/25
            /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/,  // 6.8.25 or 6.8.2025
            /(\d{2})\/(\d{2})\/(\d{4})/,   // 06/08/2025
        ];
        
        for (const pattern of israeliDatePatterns) {
            const dateMatch = fullText.match(pattern);
            if (dateMatch) {
                let day = dateMatch[1];
                let month = dateMatch[2]; 
                let year = dateMatch[3];
                
                // Convert 2-digit year to 4-digit
                if (year.length === 2) {
                    const yearNum = parseInt(year);
                    year = yearNum > 50 ? `19${year}` : `20${year}`;
                }
                
                details.date = `${day}/${month}/${year}`;
                console.log('Found Israeli date:', details.date);
                break;
            }
        }
        
        // Look for time in format "בשעה2100" and convert to "21:00"
        const timeMatch = fullText.match(/בשעה(\d{4})/);
        if (timeMatch) {
            const timeStr = timeMatch[1]; // "2100"
            const hours = timeStr.substring(0, 2);   // "21"
            const minutes = timeStr.substring(2, 4); // "00"
            details.time = `${hours}:${minutes}`;
        }
        
        // Focus ONLY on numbers that appear with currency symbols
        console.log('Full text for price detection:', fullText);
        
        // Comprehensive currency symbol patterns - only look for numbers WITH currency symbols
        const currencyPatterns = [
            // Hebrew patterns
            /(\d+)\s*₪/g,                    // 123₪
            /₪\s*(\d+)/g,                    // ₪123
            /(\d+)\s*שח/gi,                  // 123 שח
            /(\d+)\s*ש"ח/gi,                 // 123 ש"ח
            /(\d+)\s*שקל/gi,                 // 123 שקל
            /שקל\s*(\d+)/gi,                 // שקל 123
            /מחיר[\s:]*(\d+)/gi,             // מחיר: 123
            /ל(\d+)/g,                       // ל25 (like in the OCR output)
            
            // English/International patterns  
            /(\d+)\s*\$/g,                   // 123$
            /\$\s*(\d+)/g,                   // $123
            /(\d+)\s*USD/gi,                 // 123 USD
            /USD\s*(\d+)/gi,                 // USD 123
            /(\d+)\s*EUR/gi,                 // 123 EUR
            /EUR\s*(\d+)/gi,                 // EUR 123
            /(\d+)\s*GBP/gi,                 // 123 GBP
            /GBP\s*(\d+)/gi,                 // GBP 123
            /(\d+)\s*NIS/gi,                 // 123 NIS
            /NIS\s*(\d+)/gi,                 // NIS 123
        ];
        
        let foundPrices = [];
        
        // Search for ALL currency patterns
        for (const pattern of currencyPatterns) {
            let match;
            while ((match = pattern.exec(fullText)) !== null) {
                const price = parseInt(match[1]);
                if (price >= 10 && price <= 5000) { // Reasonable price range
                    foundPrices.push({
                        price: price,
                        context: match[0],
                        pattern: pattern.source
                    });
                }
            }
        }
        
        console.log('Found prices with currency symbols:', foundPrices);
        
        // Select the best price if multiple found
        if (foundPrices.length > 0) {
            // Sort by likelihood - prefer prices in typical ranges
            foundPrices.sort((a, b) => {
                // Score based on typical ticket price ranges
                const scoreA = (a.price >= 50 && a.price <= 800) ? 10 : 
                              (a.price >= 25 && a.price <= 1500) ? 5 : 1;
                const scoreB = (b.price >= 50 && b.price <= 800) ? 10 : 
                              (b.price >= 25 && b.price <= 1500) ? 5 : 1;
                return scoreB - scoreA;
            });
            
            details.originalPrice = foundPrices[0].price;
            console.log('Selected price:', foundPrices[0].price, 'from context:', foundPrices[0].context);
        } else {
            console.log('No prices found with currency symbols');
        }
        
        // Look for barcode - longest sequence of numbers and letters
        const barcodeMatch = fullText.match(/(\d{15,})/); // Look for long number sequences
        if (barcodeMatch) {
            details.barcode = barcodeMatch[1];
        }
        
        // Enhanced venue detection - look for more venue patterns
        const venuePatterns = [
            // Known Israeli venues
            /(לבונטין[\s\d]*)/i,
            /(בלומפילד|בלומפיד)/i,
            /(היכל[\s\w]*)/i,
            /(תיאטרון[\s\w]*)/i,
            /(זאפה[\s\w]*)/i,
            /(בארבי)/i,
            /(גן\s+החשמל)/i,
            /(אולמי\s+\w+)/i,
            /(סולטן\s+פול)/i,
            /(אולם\s+\w+)/i,
            /(מתחם\s+\w+)/i,
            // Address patterns
            /(תל\s+אביב[^,\n]*)/i,
            /(ירושלים[^,\n]*)/i,
            /(חיפה[^,\n]*)/i,
            /(רמת\s+גן[^,\n]*)/i,
            // Street addresses
            /(\w+\s+\d+,\s*[^,\n]+)/,
        ];
        
        for (const pattern of venuePatterns) {
            const venueMatch = fullText.match(pattern);
            if (venueMatch) {
                details.venue = venueMatch[1].trim();
                console.log('Found venue:', details.venue);
                break;
            }
        }
        
        // If no venue found with patterns, look in individual lines for location hints
        if (!details.venue) {
            for (const line of lines) {
                const cleanLine = line.trim();
                // Look for lines that might contain venue info (with numbers, street indicators)
                if (cleanLine.includes('7') || cleanLine.includes('רח') || cleanLine.includes('בול') ||
                    cleanLine.includes('אול') || cleanLine.includes('מרכז') || cleanLine.includes('היכל')) {
                    if (cleanLine.length > 10 && cleanLine.length < 100) { // Reasonable venue name length
                        details.venue = cleanLine;
                        console.log('Found venue from line analysis:', cleanLine);
                        break;
                    }
                }
            }
        }
        
        // Enhanced Hebrew seat and row detection
        const hebrewSeatMatch = fullText.match(/מושב[\s:]*(\d+)/i) || 
                               fullText.match(/מקום[\s:]*(\d+)/i) ||
                               fullText.match(/seat[\s:]*(\d+)/i);
        if (hebrewSeatMatch) {
            details.seat = hebrewSeatMatch[1];
            console.log('Found seat:', details.seat);
        }
        
        const hebrewRowMatch = fullText.match(/שורה[\s:]*(\d+)/i) ||
                              fullText.match(/row[\s:]*(\d+)/i);
        if (hebrewRowMatch) {
            details.row = hebrewRowMatch[1];
            console.log('Found row:', details.row);
        }
        
        // Look for block/section information
        const blockMatch = fullText.match(/block[\s:]*([A-Z0-9]+)/i) ||
                          fullText.match(/איזור[\s:]*([A-Z0-9]+)/i) ||
                          fullText.match(/יציע[\s:]*([A-Z0-9]+)/i);
        if (blockMatch) {
            details.section = blockMatch[1];
            console.log('Found section/block:', details.section);
        }
        
        // Look for gate information
        const gateMatch = fullText.match(/gate[\s:]*(\d+)/i) ||
                         fullText.match(/שער[\s:]*(\d+)/i);
        if (gateMatch) {
            details.gate = gateMatch[1];
            console.log('Found gate:', details.gate);
        }
        
        // If no specific artist found, try to find meaningful text from clean lines
        if (!details.artist) {
            for (const line of lines) {
                // Skip very short lines, numbers only, or messy OCR lines
                if (line.length >= 4 && !/^\d+$/.test(line) && !/^[^\w\s]+$/.test(line)) {
                    const cleanLine = line.replace(/[^\u0590-\u05FF\u0020-\u007E]/g, '').trim();
                    if (cleanLine.length >= 3) {
                        details.title = cleanLine;
                        details.artist = cleanLine;
                        break;
                    }
                }
            }
        }
        
        console.log('Final parsed details:', details);
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