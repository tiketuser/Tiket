'use client'

import { useState } from "react";
import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import ProgressBar from "../ProgressBar/ProgressBar";

import StepOneUploadTicket from "./UploadTicketSteps/StepOneUploadTicket";
import StepTwoUploadTicket from "./UploadTicketSteps/StepTwoUploadTicket";
import StepThreeUploadTicket from "./UploadTicketSteps/StepThreeUploadTicket";
import StepFourUploadTicket from "./UploadTicketSteps/StepFourUploadTicket";

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
            description: "בחר את הדרך הנוחה לך בכדי להעלות את הכרטיס",
            height: "lg:h-[912px] md:h-[670px] h-[580px]",
            width: "lg:w-[880px] md:w-[750px] w-[360px]",
            content: <StepOneUploadTicket nextStep={nextStep}/>
        },
        {
            heading: "תמחר את הכרטיס שלך",
            description: "ציין את המחיר המבוקש",
            height: "lg:h-[704px] h-[555px]",
            width: "lg:w-[880px] w-[360px]",
            content: <StepTwoUploadTicket nextStep={nextStep} prevStep={prevStep}/>  
        },
        {
            heading: "אשר את הפרטים",
            description: "בדוק את פרטי הכרטיס",
            height: "lg:h-[830px] h-[541px]",
            width: "lg:w-[880px] w-[370px]",
            content: <StepThreeUploadTicket nextStep={nextStep} prevStep={prevStep}/>
        },
        {
            heading: "פורסם בהצלחה!",
            description: "הכרטיס שלך פורסם בהצלחה!",
            height: "lg:h-[766px] h-[500px]",
            width: "lg:w-[880px] w-[370px]",
            content: <StepFourUploadTicket nextStep={nextStep} prevStep={prevStep}/>
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
