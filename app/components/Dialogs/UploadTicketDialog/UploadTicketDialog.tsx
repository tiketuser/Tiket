'use client'

import { useState } from "react";
import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import ProgressBar from "../ProgressBar/ProgressBar";

import StepOneUploadTicket from "./UploadTicketSteps/StepOneUploadTicket";
import StepTwoUploadTicket from "./UploadTicketSteps/StepTwoUploadTicket";
import StepThreeUploadTicket from "./UploadTicketSteps/StepThreeUploadTicket";
import StepFourUploadTicket from "./UploadTicketSteps/StepFourUploadTicket";
import { TicketData } from "./UploadTicketSteps/UploadTicketInterface.types";

// Firebase imports
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../../firebase';

interface UploadTicketInterface {
    isOpen: boolean;
    onClose: () => void;
}

const UploadTicketDialog: React.FC<UploadTicketInterface> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [ticketData, setTicketData] = useState<TicketData>({});
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);

    // Function to publish ticket to Firebase
    const publishTicket = async () => {
        if (!ticketData.ticketDetails || !ticketData.pricing) {
            setPublishError("חסרים פרטי כרטיס או תמחור");
            return false;
        }

        if (!db || !storage) {
            setPublishError("מסד הנתונים לא זמין כרגע");
            return false;
        }

        setIsPublishing(true);
        setPublishError(null);

        try {
            let imageUrl = null;

            // Upload image if available
            if (ticketData.uploadedFile && storage) {
                const imageRef = ref(storage, `ticket-images/${Date.now()}-${ticketData.uploadedFile.name}`);
                const snapshot = await uploadBytes(imageRef, ticketData.uploadedFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            // Create ticket document
            const ticketDoc = {
                // Basic details
                title: ticketData.ticketDetails.title || '',
                artist: ticketData.ticketDetails.artist || '',
                date: ticketData.ticketDetails.date || '',
                time: ticketData.ticketDetails.time || '',
                venue: ticketData.ticketDetails.venue || '',
                
                // Seating information
                seat: ticketData.ticketDetails.seat || '',
                row: ticketData.ticketDetails.row || '',
                section: ticketData.ticketDetails.section || '',
                barcode: ticketData.ticketDetails.barcode || '',
                
                // Pricing
                askingPrice: ticketData.pricing.askingPrice,
                originalPrice: ticketData.ticketDetails.originalPrice || null,
                allowPriceSuggestions: ticketData.pricing.allowPriceSuggestions || false,
                minPrice: ticketData.pricing.minPrice || null,
                maxPrice: ticketData.pricing.maxPrice || null,
                
                // Metadata
                imageUrl,
                extractedText: ticketData.extractedText || null,
                status: 'active',
                createdAt: serverTimestamp(),
                sellerId: 'anonymous', // Replace with actual user ID when auth is implemented
                
                // Additional fields for marketplace
                views: 0,
                favorites: 0,
                inquiries: 0
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db!, 'tickets'), ticketDoc);
            
            // Update ticket data with the document ID
            setTicketData(prev => ({ ...prev, ticketId: docRef.id }));
            
            setIsPublishing(false);
            return true;

        } catch (error) {
            console.error('Error publishing ticket:', error);
            setPublishError("שגיאה בפרסום הכרטיס. נסה שוב.");
            setIsPublishing(false);
            return false;
        }
    };

    // Enhanced nextStep function to handle publishing
    const nextStep = async () => {
        if (step === 3) {
            // Before moving to step 4, publish the ticket
            const success = await publishTicket();
            if (success) {
                setStep(4);
            }
        } else {
            setStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    // Function to update ticket data
    const updateTicketData = (updates: Partial<TicketData>) => {
        setTicketData(prev => ({ ...prev, ...updates }));
    };

    // Reset dialog state when closing
    const handleClose = () => {
        setStep(1);
        setTicketData({});
        setIsPublishing(false);
        setPublishError(null);
        onClose();
    };

    // Define steps as objects containing heading, description, and content
    const steps = [
        {
            heading: "העלה את הכרטיס שלך למכירה",
            description: "בחר אחת מהדרכים",
            height: "h-[912px]",
            width: "w-[880px]",
            content: <StepOneUploadTicket 
                nextStep={nextStep} 
                ticketData={ticketData} 
                updateTicketData={updateTicketData} 
            />
        },
        {
            heading: "תמחר את הכרטיס שלך",
            description: "ציין את המחיר המבוקש",
            height: "h-[704px]",
            width: "w-[880px]",
            content: <StepTwoUploadTicket 
                nextStep={nextStep} 
                prevStep={prevStep} 
                ticketData={ticketData} 
                updateTicketData={updateTicketData} 
            />  
        },
        {
            heading: "אשר את הפרטים",
            description: "בדוק את פרטי הכרטיס",
            height: "h-[750px]",
            width: "w-[880px]",
            content: <StepThreeUploadTicket 
                nextStep={nextStep} 
                prevStep={prevStep} 
                ticketData={ticketData} 
                updateTicketData={updateTicketData} 
            />
        },
        {
            heading: "פורסם בהצלחה!",
            description: "הכרטיס שלך פורסם בהצלחה!",
            height: "h-[766px]",
            width: "w-[880px]",
            content: <StepFourUploadTicket 
                nextStep={nextStep} 
                prevStep={prevStep} 
                ticketData={ticketData} 
                updateTicketData={updateTicketData} 
            />
        }
    ];

    return (
        <AdjustableDialog 
            isOpen={isOpen} 
            onClose={onClose}
            height={steps[step - 1].height}
            width={steps[step - 1].width}
            heading={steps[step - 1].heading}  // Dynamically change heading
            description={steps[step - 1].description} // Dynamically change description
            topChildren={<ProgressBar step={step} />}
        >
            {steps[step - 1].content}
        </AdjustableDialog>
    );
}

export default UploadTicketDialog;
