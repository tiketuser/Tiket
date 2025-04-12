import Image from "next/image";

import { UploadTicketInterface } from "./UploadTicketInterface.types";

import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

const StepThreeUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep 
}) => {
    return (
        <>
            <div className="lg:w-[668px] w-[320px] lg:mt-12 mt-6">

                {/* Title and Subtitle */}
                <p className="lg:text-heading-5-desktop text-heading-5-mobile font-bold">
                    פרסום כרטיס
                </p>
                <p className="lg:text-text-medium text-text-small font-bold text-strongText">
                    בפניך מוצג הכרטיס עם כל הפרטים כפי שנרשמו במערכת. בדוק שהפרטים נכונים, אם הכל בסדר, אשר את הכרטיס להעלאה למכירה.            
                </p>         
            </div> 

            <div className="mt-8">
                <MinimalCard 
                    price={500}
                    title="עלמה גוב"
                    date="15 אוק׳"
                    seatLocation="יציע 4 שורה 24"
                    width="lg:w-[880px] w-[360px]"
                />
            </div>

            <div className="lg:w-[600px] w-[350px] lg:mt-8 mt-4">
                <p className="lg:text-text-medium text-text-small font-bold text-strongText">
                    פרט לא תקין? שלח את הכרטיס לבדיקה כדי שנתקן את הפרטים.
                </p>

                <div className="flex flex-col items-center lg:gap-2 gap-1">
                    <button 
                        className="btn lg:w-full w-[256px] min-h-0 lg:h-[46px] h-[32px] btn-secondary bg-white text-primary border-primary border-[1px] lg:text-text-large text-text-small font-normal"
                    >
                        הוסף כרטיס
                    </button>

                    <label className="link link-hover text-primary border-transparent lgtext-text-large text-text-small font-normal cursor-pointer">
                        שלח לבדיקה
                    </label>
                </div>
            </div>


            <div className="flex justify-center gap-10 mt-14">
                <button 
                    className="btn lg:w-[140px] w-[130px] min-h-0 lg:h-[46px] h-[32px] btn-secondary bg-white text-primary border-primary border-[2px] lg:text-text-large text-text-small font-normal"
                    onClick={prevStep}
                >
                    לשלב הקודם
                </button>

                <button 
                    id="nextStep"
                    className="btn lg:w-[140px] w-[130px] lg:h-[46px] h-[32px] min-h-0 btn-secondary bg-primary text-white lg:text-text-large text-text-small font-normal disabled:bg-secondary disabled:text-white"
                    onClick={nextStep}
                >
                    פרסום כרטיס  
                </button>
            </div>
        </>
        
    );
};

export default StepThreeUploadTicket;
