import Image from "next/image";

import { UploadTicketInterface } from "./UploadTicketInterface.types";


const StepFourUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep 
}) => {
    return (
        <div>
            <div className="w-[668px] mt-12">

                {/* Title and Subtitle */}
                <p className="text-heading-5-desktop font-bold">
                    בהצלחה במכירה!
                </p>
                <p className="text-text-medium font-bold text-strongText">
                    תוכל לראות את הכרטיס ביחד עם שאר הכרטיסים במודעות שלך.            
                </p>         
            </div> 

            <div className="flex flex-col items-center gap-2 w-[668px]">
                <button 
                    id="nextStep"
                    className="btn w-full h-[48px] min-h-0 btn-secondary bg-primary text-white text-text-large font-normal disabled:bg-secondary disabled:text-white mt-12 mx-auto block"
                >
                    המודעות שלי  
                </button>

                <label className="link link-hover text-primary border-transparent text-text-large font-normal cursor-pointer">
                    לדף הבית
                </label>
            </div>

            <div className="flex flex-col items-center gap-2 w-[340px]">

                <p className="text-heading-5-desktop font-bold">
                    שתף את הכרטיס ברשתות החברתיות
                </p>

                <button 
                    id="nextStep"
                    className="btn w-full h-[48px] min-h-0 btn-secondary bg-primary text-white text-text-large font-normal disabled:bg-secondary disabled:text-white mt-12 mx-auto block"
                >
                    המודעות שלי  
                </button>

            </div>
         
        </div>
        
    );
};

export default StepFourUploadTicket;
