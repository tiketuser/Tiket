import Image from "next/image";
import ShekelsIcon from "@/public/images/Dialogs/shekelsicon.svg";

import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";

import CheckBox from "@/app/components/CheckBox/CheckBox";
import ToggleCheckBox from "@/app/components/CheckBox/ToggleCheckBox";

const StepTwoUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep 
}) => {
    return (
        <div className="lg:w-[518px] w-[320px] lg:mt-12 mt-4">

            {/* Title and Subtitle */}
            <p className="lg:text-heading-5-desktop text-heading-5-mobile font-bold">תמחור כרטיס</p>
            <p className="lg:text-text-medium text-text-small font-bold text-strongText">
                תוכל לאפשר לקונים להציע מחירים נמוכים יותר או להציע מחיר קבוע בלבד.
            </p>           

            <form className="lg:w-[456px] mx-auto block lg:mt-7 mt-4">
                {/* Price Input */}
                <CustomInput 
                    id="ticket-price" 
                    width="w-full" 
                    placeholder="מחיר לכרטיס"
                    image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                />
                <div className="lg:mt-4 mt-2">
                    <CheckBox text="אפשר הצעת מחיר"/>
                </div>

                {/* Min - Max Price Inputs (Aligned Horizontally) */}
                <div className="flex gap-8 mx-auto lg:mt-4 mt-2">
                    <CustomInput 
                        id="min-price" 
                        width="w-[212px]" 
                        placeholder="מ -" 
                        image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                    />
                    <CustomInput 
                        id="max-price" 
                        width="w-[212px]" 
                        placeholder="עד -" 
                        image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                    />
                </div>

                {/* Toggle Checkbox at the Bottom */}
                <div className="mt-2">
                    <ToggleCheckBox />
                </div>

                <div className="flex justify-center gap-10 lg:mt-14 mt-5">
                    <button 
                        className="btn lg:w-[140px] w-[120px] lg:h-[46px] h-[32px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] lg:text-text-large text-text-small font-normal"
                        onClick={prevStep}
                    >
                        לשלב הקודם
                    </button>

                    <button 
                        id="nextStep"
                        className="btn lg:w-[140px] w-[120px] lg:h-[46px] h-[32px] min-h-0 btn-secondary bg-primary text-white lg:text-text-large text-text-small font-normal disabled:bg-secondary disabled:text-white"
                        onClick={nextStep}
                    >
                        לשלב הבא   
                    </button>
                </div>      
            </form>
        </div>
    );
};

export default StepTwoUploadTicket;
