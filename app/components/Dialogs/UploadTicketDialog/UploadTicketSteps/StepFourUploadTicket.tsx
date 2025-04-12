import Image from "next/image";

import { UploadTicketInterface } from "./UploadTicketInterface.types";

import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

import ShareIcon from "@/public/images/Dialogs/ShareIcon.svg"

const StepFourUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep 
}) => {
    return (
        <>
            <div className="lg:w-[668px] w-[320px] lg:mt-12 mt-6">

                {/* Title and Subtitle */}
                <p className="lg:text-heading-5-desktop text-heading-5-mobile font-bold">
                    בהצלחה במכירה!
                </p>
                <p className="lg:text-text-medium text-text-small font-bold text-strongText">
                    תוכל לראות את הכרטיס ביחד עם שאר הכרטיסים במודעות שלך.            
                </p>         
            </div> 

            <div className="flex flex-col items-center lg:gap-2 gap-1 lg:w-[668px] w-[256px]">
                <button 
                    id="nextStep"
                    className="btn w-full min-h-0 lg:h-[48px] h-[32px]  btn-secondary bg-primary text-white text-text-large font-normal disabled:bg-secondary disabled:text-white mt-12 mx-auto block"
                >
                    המודעות שלי  
                </button>

                <label className="link link-hover text-primary border-transparent lg:text-text-large text-text-medium font-normal cursor-pointer">
                    לדף הבית
                </label>
            </div>

            <div className="flex flex-col items-center lg:gap-2 gap-1 lg:mt-12 mt-6">

                <p className="lg:text-heading-5-desktop text-text-small lg:font-bold">
                    שתף את הכרטיס ברשתות החברתיות
                </p>

                <button 
                    id="nextStep"
                    className="btn lg:w-[340px] w-[188px] min-h-0 lg:h-[48px] h-[32px] btn-secondary bg-secondary text-primary lg:text-text-large text-text-small font-normal disabled:bg-secondary disabled:text-white mx-auto block"
                >
                    <div className="flex items-center justify-center gap-2">                        
                        <Image src={ShareIcon} alt="ShareIcon" />
                        <label>שתף</label>
                    </div>
                </button>

            </div>

            <div className="absolute bottom-1 left-0">
                <MinimalCard 
                    price={500}
                    priceBefore={600}
                    title="עלמה גוב"
                    date="15 אוק׳"
                    seatLocation="היכל התרבות - תל אביב"
                    width="w-[880px]"
                />
            </div>
         
        </>
        
    );
};

export default StepFourUploadTicket;
