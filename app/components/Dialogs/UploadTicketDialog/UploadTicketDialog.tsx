'use client'

import { useState } from "react";
import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import ProgressBar from "../ProgressBar/ProgressBar";

import StepOneUploadTicket from "./UploadTicketSteps/StepOneUploadTicket";
import StepTwoUploadTicket from "./UploadTicketSteps/StepTwoUploadTicket";

interface UploadTicketInterface {
    isOpen: boolean;
    onClose: () => void;
}

const UploadTicketDialog: React.FC<UploadTicketInterface> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);

    // Callback functions to change steps
    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    // Define steps as objects containing heading, description, and content
    const steps = [
        {
            heading: "העלה את הכרטיס שלך למכירה",
            description: "בחר אחת מהדרכים",
            height: "h-[912px]",
            width: "w-[880px]",
            content: <StepOneUploadTicket nextStep={nextStep}/>
        },
        {
            heading: "תמחר את הכרטיס שלך",
            description: "ציין את המחיר המבוקש",
            height: "h-[704px]",
            width: "w-[880px]",
            content: <StepTwoUploadTicket nextStep={nextStep} prevStep={prevStep}/>  
        },
        {
            heading: "אשר את הפרטים",
            description: "בדוק את פרטי הכרטיס",
            height: "h-[830px]",
            width: "w-[880px]",
            content: <div><p>Step 3 Content Here</p></div>
        },
        {
            heading: "פורסם בהצלחה!",
            description: "הכרטיס שלך פורסם בהצלחה!",
            height: "h-[638px]",
            width: "w-[880px]",
            content: <div><p>Step 4 Content Here</p></div>
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
