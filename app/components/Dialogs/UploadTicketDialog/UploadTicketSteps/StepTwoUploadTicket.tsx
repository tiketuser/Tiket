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
        <div className="w-[518px] mt-12">

            {/* Title and Subtitle */}
            <p className="text-heading-5-desktop font-bold">תמחור כרטיס</p>
            <p className="text-text-medium font-bold text-strongText">
                תוכל לאפשר לקונים להציע מחירים נמוכים יותר או להציע מחיר קבוע בלבד.
            </p>           

            <form className="w-[456px] mx-auto block mt-7">
                {/* Price Input */}
                <CustomInput 
                    id="ticket-price" 
                    name="ticket-price"
                    width="w-full" 
                    placeholder="מחיר לכרטיס" 
                    image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                />
                <div className="mt-4">
                    <CheckBox text="אפשר הצעת מחיר"/>
                </div>

                {/* Min - Max Price Inputs (Aligned Horizontally) */}
                <div className="flex gap-8 mx-auto mt-4">
                    <CustomInput 
                        id="min-price" 
                        name="min-price"
                        width="w-[212px]" 
                        placeholder="מ -" 
                        image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                    />
                    <CustomInput 
                        id="max-price" 
                        name="max-price"
                        width="w-[212px]" 
                        placeholder="עד -" 
                        image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                    />
                </div>

                {/* Toggle Checkbox at the Bottom */}
                <div className="mt-2">
                    <ToggleCheckBox />
                </div>

                <div className="flex justify-center gap-10 mt-14">
                    <button 
                        className="btn w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-text-large font-normal"
                        onClick={prevStep}
                    >
                        לשלב הקודם
                    </button>

                    <button 
                        id="nextStep"
                        className="btn w-[140px] h-[46px] min-h-0 btn-secondary bg-primary text-white text-text-large font-normal disabled:bg-secondary disabled:text-white"
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
