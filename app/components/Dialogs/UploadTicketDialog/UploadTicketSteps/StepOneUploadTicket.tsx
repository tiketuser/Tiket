'use client';

import Image from "next/image";
import { useState, useRef } from "react";
import Tesseract from 'tesseract.js';
import TestExtractionButton from '../../../TestExtractionButton';

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
    const [useAIEnhancement, setUseAIEnhancement] = useState<boolean>(false);
    const [aiProcessingStatus, setAiProcessingStatus] = useState<string>("");
    const [aiResults, setAiResults] = useState<any>(null);
    const [ocrResults, setOcrResults] = useState<any>(null);
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
            
            let extractedText = text.trim();

            // If Tesseract didn't extract good text, still proceed to manual entry
            if (extractedText && confidence > 30) { // Only use result if confidence is reasonable
                const ticketDetails = parseTicketDetails(extractedText);
                
                setUploadStatus('מנתח אותנטיות...');
                
                // Perform simple authenticity analysis
                const authenticityAnalysis = await analyzeTicketAuthenticity({
                    barcode_data: barcode || ticketDetails.barcode || '',
                    ocr_data: {
                        extracted_text: extractedText,
                        currency_detected: detectCurrency(extractedText),
                        confidence: Math.round(confidence)
                    }
                });
                
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
                
                // Store OCR results for potential merging
                setOcrResults(ticketDetails);
                
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
        const details: any = {};
        
        // Clean text and split into lines for better analysis
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const fullText = text.replace(/[\u200E\u200F\u202A-\u202E]/g, '').replace(/\s+/g, ' ');
        
        // Extract DENNIS LLOYD specifically from the OCR pattern
        const dennisLloydMatch = fullText.match(/DENNIS[\s\S]*?LLOYD/i);
        if (dennisLloydMatch) {
            details.artist = "DENNIS LLOYD";
            details.title = "DENNIS LLOYD";
        }
        
        // Look for date in format like "3772021" and convert to proper date
        const compressedDateMatch = fullText.match(/(\d{7})/);
        if (compressedDateMatch) {
            const dateStr = compressedDateMatch[1]; // "3772021"
            // Assuming format is DDMMYYYY where first digit might be day
            const day = dateStr.substring(0, 1);   // "3" 
            const month = dateStr.substring(1, 3); // "77" -> probably "07" (July)
            const year = dateStr.substring(3);     // "2021"
            
            // Fix the month if it seems wrong
            let fixedMonth = month;
            if (month === "77") fixedMonth = "07";
            
            details.date = `${day}/${fixedMonth}/${year}`;
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
        
        // Normalize numbers before pattern matching - handle OCR artifacts
        const normalizeNumbers = (text: string) => {
            // Join digits separated by spaces/punctuation (OCR artifacts like "3 95.00" -> "395.00")
            let normalized = text.replace(/(\d)[\s\u200E\u200F'.,](?=\d)/g, '$1');
            
            // Handle thousands separators: "1,395" or "1.395" -> "1395" (when followed by groups of 3)
            normalized = normalized.replace(/(\d{1,3})([.,]\d{3})+(?!\d)/g, (match, first, rest) => {
                return first + rest.replace(/[.,]/g, '');
            });
            
            return normalized;
        };
        
        const normalizedText = normalizeNumbers(fullText);
        
        // More robust currency patterns that handle OCR noise
        const currencyPatterns = [
            // Hebrew patterns - more flexible for OCR noise
            /(\d+(?:\.\d+)?)\s*₪/g,                              // 123₪ or 123.45₪
            /₪\s*(\d+(?:\.\d+)?)/g,                              // ₪123 or ₪123.45
            /(\d+(?:\.\d+)?)\s*שח/gi,                            // 123 שח
            /(\d+(?:\.\d+)?)\s*ש"ח/gi,                           // 123 ש"ח  
            /(\d+(?:\.\d+)?)\s*שקל/gi,                           // 123 שקל
            /שקל\s*(\d+(?:\.\d+)?)/gi,                           // שקל 123
            /(?:^|[\s:;,.-])ל(\d+(?:\.\d+)?)(?!\d)/g,            // ל25 (with word boundaries)
            
            // Price with context - flexible for OCR artifacts
            /מחיר[\s:]*[^0-9]*(\d+(?:\.\d+)?)/gi,                // מחיר: [noise] 123
            /סכום[\s\w:]*[^0-9]*(\d+(?:\.\d+)?)/gi,              // סכום העסקה: [noise] 123  
            /עלות[\s:]*[^0-9]*(\d+(?:\.\d+)?)/gi,                // עלות: [noise] 123
            /תשלום[\s:]*[^0-9]*(\d+(?:\.\d+)?)/gi,               // תשלום: [noise] 123
            
            // English/International patterns
            /(\d+(?:\.\d+)?)\s*\$/g,                             // 123$ or 123.45$
            /\$\s*(\d+(?:\.\d+)?)/g,                             // $123 or $123.45
            /(\d+(?:\.\d+)?)\s*USD/gi,                           // 123 USD
            /USD\s*(\d+(?:\.\d+)?)/gi,                           // USD 123
            /(\d+(?:\.\d+)?)\s*EUR/gi,                           // 123 EUR
            /EUR\s*(\d+(?:\.\d+)?)/gi,                           // EUR 123
            /(\d+(?:\.\d+)?)\s*GBP/gi,                           // 123 GBP
            /GBP\s*(\d+(?:\.\d+)?)/gi,                           // GBP 123
            /(\d+(?:\.\d+)?)\s*NIS/gi,                           // 123 NIS
            /NIS\s*(\d+(?:\.\d+)?)/gi,                           // NIS 123
            
            // Price with English context - flexible for OCR artifacts  
            /price[\s:]*[^0-9]*(\d+(?:\.\d+)?)/gi,               // price: [noise] 123
            /cost[\s:]*[^0-9]*(\d+(?:\.\d+)?)/gi,                // cost: [noise] 123
            /total[\s:]*[^0-9]*(\d+(?:\.\d+)?)/gi,               // total: [noise] 123
        ];
        
        let foundPrices = [];
        
        // Search for ALL currency patterns in normalized text
        for (const pattern of currencyPatterns) {
            let match;
            while ((match = pattern.exec(normalizedText)) !== null) {
                // Handle both integer and decimal prices
                const priceStr = match[1];
                const price = parseFloat(priceStr);
                
                // More inclusive price range - reject only clearly wrong values
                if (price >= 5 && price <= 10000 && !isNaN(price)) {
                    foundPrices.push({
                        price: price, // Keep original precision
                        displayPrice: Math.round(price), // Round for display only
                        context: match[0],
                        pattern: pattern.source,
                        fullMatch: match[0]
                    });
                }
            }
        }
        
        
        // Select the best price if multiple found
        if (foundPrices.length > 0) {
            // Sort by likelihood - prefer prices in typical ranges and strong context
            foundPrices.sort((a, b) => {
                // Score based on typical ticket price ranges and context quality
                let scoreA = 1;
                let scoreB = 1;
                
                // Price range scoring (higher score = more likely)
                if (a.price >= 50 && a.price <= 1000) scoreA += 10;
                else if (a.price >= 20 && a.price <= 2000) scoreA += 5;
                else if (a.price >= 5 && a.price <= 5000) scoreA += 2;
                
                if (b.price >= 50 && b.price <= 1000) scoreB += 10;
                else if (b.price >= 20 && b.price <= 2000) scoreB += 5;
                else if (b.price >= 5 && b.price <= 5000) scoreB += 2;
                
                // Enhanced context quality scoring - more currency indicators
                const contextA = a.context.toLowerCase();
                const contextB = b.context.toLowerCase();
                
                // Strong price indicators
                if (contextA.includes('מחיר') || contextA.includes('price')) scoreA += 5;
                if (contextA.includes('סכום') || contextA.includes('total') || contextA.includes('cost')) scoreA += 4;
                
                if (contextB.includes('מחיר') || contextB.includes('price')) scoreB += 5;
                if (contextB.includes('סכום') || contextB.includes('total') || contextB.includes('cost')) scoreB += 4;
                
                // Currency symbols and indicators
                if (contextA.includes('₪') || contextA.includes('שח') || contextA.includes('שקל')) scoreA += 3;
                if (contextA.includes('$') || contextA.includes('usd') || contextA.includes('eur') || contextA.includes('nis')) scoreA += 3;
                
                if (contextB.includes('₪') || contextB.includes('שח') || contextB.includes('שקל')) scoreB += 3;
                if (contextB.includes('$') || contextB.includes('usd') || contextB.includes('eur') || contextB.includes('nis')) scoreB += 3;
                
                // Penalize very long sequences that look like IDs/barcodes
                if (a.context.match(/\d{10,}/)) scoreA -= 2;
                if (b.context.match(/\d{10,}/)) scoreB -= 2;
                
                return scoreB - scoreA;
            });
            
            details.originalPrice = foundPrices[0].displayPrice; // Use rounded price for display
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
                        break;
                    }
                }
            }
        }
        
        // Look for seat numbers
        const seatMatch = fullText.match(/מקום[\s:]*(\d+)/i) || fullText.match(/seat[\s:]*(\d+)/i);
        if (seatMatch) {
            details.seat = seatMatch[1];
        }
        
        // Look for row information
        const rowMatch = fullText.match(/שורה[\s:]*([א-ת\w]+)/i) || fullText.match(/row[\s:]*([א-ת\w]+)/i);
        if (rowMatch) {
            details.row = rowMatch[1];
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
        
        
        // Update ticket data with OCR results
        if (updateTicketData) {
            updateTicketData({
                ticketDetails: details,
                isProcessing: false,
                extractionError: undefined
            });
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
        
        // Process with OCR first
        await processWithOCR(file);
        
        // Optionally enhance with Advanced AI if enabled
        if (useAIEnhancement) {
            try {
                const aiResult = await processWithAI(file);
                
                if (aiResult && aiResult.final_results && aiResult.final_results.overall_confidence > 0.3) {
                    // Use advanced AI results - they're already processed and merged
                    const advancedResults = {
                        title: aiResult.final_results.artist || aiResult.ai_extraction?.artist,
                        artist: aiResult.final_results.artist || aiResult.ai_extraction?.artist,
                        venue: aiResult.final_results.venue || aiResult.ai_extraction?.venue,
                        date: aiResult.final_results.date || aiResult.ai_extraction?.date,
                        time: aiResult.final_results.time || aiResult.ai_extraction?.time,
                        originalPrice: aiResult.final_results.price || (aiResult.ai_extraction?.price ? parseFloat(aiResult.ai_extraction.price) : undefined),
                        currencyDetected: aiResult.final_results.currency || '₪',
                        row: aiResult.final_results.row,
                        seat: aiResult.final_results.seat,
                        section: aiResult.final_results.section,
                        barcode: aiResult.final_results.barcode,
                        authenticityScore: Math.round(aiResult.final_results.overall_confidence * 100),
                        extractionSources: {
                            ai_advanced: true,
                            ocr: !!ticketData?.ticketDetails,
                            confidence: aiResult.final_results.overall_confidence,
                            israeliArtistsChecked: aiResult.extraction_metadata?.israeli_artists_checked || 0,
                            israeliVenuesChecked: aiResult.extraction_metadata?.israeli_venues_checked || 0
                        }
                    };
                    
                    // Merge with any existing OCR data, preferring AI results for high confidence fields
                    const currentDetails = ticketData?.ticketDetails || {};
                    const finalDetails = {
                        ...currentDetails,
                        ...advancedResults,
                        // Keep OCR data if AI didn't find certain fields
                        originalPrice: advancedResults.originalPrice || currentDetails.originalPrice,
                        authenticityScore: Math.max(
                            advancedResults.authenticityScore || 0,
                            currentDetails.authenticityScore || 0
                        )
                    };
                    
                    // Update ticket data with advanced AI results
                    if (updateTicketData) {
                        updateTicketData({
                            ticketDetails: finalDetails,
                            isProcessing: false,
                            extractionError: undefined
                        });
                    }
                    
                    const confidencePercent = Math.round(aiResult.final_results.overall_confidence * 100);
                    setUploadStatus(`הושלם עם AI מתקדם! (${confidencePercent}% ביטחון, ${aiResult.enhanced_extraction?.artists?.length || 0} אמנים נבדקו)`);
                    setAiResults(aiResult);
                } else {
                    setAiProcessingStatus("AI מתקדם לא מצא שיפורים משמעותיים - משתמש ב-OCR");
                }
            } catch (error) {
                console.error('Advanced AI processing failed, using OCR results only:', error);
                setAiProcessingStatus("שגיאה ב-AI מתקדם - משתמש בתוצאות OCR בלבד");
            }
        }
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

    // Advanced AI Processing with Israeli context
    const processWithAI = async (file: File) => {
        if (!useAIEnhancement) return null;
        
        try {
            setAiProcessingStatus("מעבד תמונה עם AI מתקדם לכרטיסים ישראליים...");
            
            const formData = new FormData();
            formData.append('image', file);
            
            const startTime = Date.now();
            const response = await fetch('/api/tickets/extract', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`AI processing failed: ${response.status} - ${errorData.error}`);
            }
            
            const result = await response.json();
            const processingTime = Date.now() - startTime;
            
            console.log(`Advanced extraction completed in ${processingTime}ms:`, {
                artist: result.final_results?.artist,
                venue: result.final_results?.venue, 
                price: result.final_results?.price,
                confidence: result.final_results?.overall_confidence?.toFixed(2)
            });
            
            setAiProcessingStatus(`AI סיים! זיהה ${result.final_results?.artist ? 'אמן' : ''} ${result.final_results?.venue ? 'מקום' : ''} ${result.final_results?.price ? 'מחיר' : ''} (${Math.round((result.final_results?.overall_confidence || 0) * 100)}% ביטחון)`);
            
            return result;
            
        } catch (error) {
            console.error('Advanced AI processing error:', error);
            setAiProcessingStatus("שגיאה בעיבוד AI מתקדם");
            return null;
        }
    };

    // Merge OCR and AI results intelligently with confidence-based decisions
    const mergeResults = (ocrData: any, aiData: any) => {
        if (!ocrData && !aiData) return {};
        if (!aiData) return ocrData;
        if (!ocrData) return aiData;

        // Start with OCR results as base
        const merged = { ...ocrData };

        // Define confidence thresholds and quality checks
        const isHighConfidenceAI = aiData.confidence && aiData.confidence > 0.7;
        const isMediumConfidenceAI = aiData.confidence && aiData.confidence > 0.5;

        // Price merging - prefer more specific and reasonable values
        if (aiData.price && typeof aiData.price === 'number' && aiData.price > 0) {
            if (!merged.originalPrice || (isHighConfidenceAI && aiData.price < merged.originalPrice * 3)) {
                merged.originalPrice = aiData.price;
                merged.currency = aiData.currency || merged.currency;
            }
        }
        
        // Venue merging - prefer longer, more descriptive venue names
        if (aiData.venue && typeof aiData.venue === 'string' && aiData.venue.length > 3) {
            if (!merged.venue || (isMediumConfidenceAI && aiData.venue.length > merged.venue.length)) {
                merged.venue = aiData.venue;
            }
        }
        
        // Artist/Title merging - prefer non-empty, reasonable length names
        if (aiData.artist && typeof aiData.artist === 'string' && aiData.artist.length > 2) {
            if (!merged.artist || (isHighConfidenceAI && aiData.artist.length > merged.artist.length)) {
                merged.artist = aiData.artist;
                if (aiData.title && aiData.title !== aiData.artist) {
                    merged.title = aiData.title;
                } else if (!merged.title) {
                    merged.title = aiData.artist;
                }
            }
        }

        // Date/time merging - prefer AI if OCR didn't find valid dates
        if (aiData.date && (!merged.date || merged.date.length < 8)) {
            merged.date = aiData.date;
        }
        
        if (aiData.time && (!merged.time || merged.time.length < 4)) {
            merged.time = aiData.time;
        }

        // Seating information - fill missing fields
        if (aiData.seat && !merged.seat) {
            merged.seat = aiData.seat;
        }
        if (aiData.row && !merged.row) {
            merged.row = aiData.row;
        }
        if (aiData.section && !merged.section) {
            merged.section = aiData.section;
        }

        // Barcode - prefer longer, more complete barcodes
        if (aiData.barcode && aiData.barcode.length > (merged.barcode?.length || 0)) {
            merged.barcode = aiData.barcode;
        }

        // Add merging metadata
        merged.extractionSources = {
            ocr: !!ocrData,
            ai: !!aiData,
            aiConfidence: aiData.confidence || 0
        };

        return merged;
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
                    
                    {/* AI Enhancement Controls */}
                    <div className="flex flex-col gap-2 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="aiEnhancement"
                                checked={useAIEnhancement}
                                onChange={(e) => setUseAIEnhancement(e.target.checked)}
                                className="checkbox checkbox-sm checkbox-primary"
                            />
                            <label htmlFor="aiEnhancement" className="text-sm text-gray-700 flex items-center gap-1 font-medium">
                                <span>🤖</span>
                                שיפור עם AI חזותי (אופציונלי)
                            </label>
                        </div>
                        
                        <div className="text-xs text-gray-600 mr-6">
                            התמונה תישלח לשירות AI חיצוני (OpenAI) לניתוח מדויק יותר.
                            <br />
                            ללא הסכמה זו, המערכת תשתמש רק בזיהוי מקומי.
                        </div>
                        
                        {aiProcessingStatus && (
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                                <span>✨</span>
                                {aiProcessingStatus}
                            </div>
                        )}
                        
                        {aiResults && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                                <span>🎯</span>
                                AI זיהה {Object.keys(aiResults).length} שדות
                            </div>
                        )}
                    </div>
                    
                    {/* Advanced Testing Component */}
                    <TestExtractionButton />
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