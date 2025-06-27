// import Image from "next/image";

import { UploadTicketInterface } from "./UploadTicketInterface.types";

import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

const StepThreeUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep 
}) => {
    return (
        <div>
            <div className="w-[668px] mt-12 pr-36">

                {/* Title and Subtitle */}
                <p className="text-heading-5-desktop font-bold">
                    פרסום כרטיס
                </p>
                <p className="text-text-medium font-bold text-strongText">
                    בפניך מוצג הכרטיס עם כל הפרטים כפי שנרשמו במערכת. בדוק שהפרטים נכונים, אם הכל בסדר, אשר את הכרטיס להעלאה למכירה.            
                </p>         
            </div> 

            <div className="mt-8">
                <MinimalCard 
                    price={500}
                    title="עלמה גוב"
                    date="15 אוק׳"
                    seatLocation="יציע 4 שורה 24"
                    width="w-[880px]"
                />
            </div>

            <div className="w-[600px] mr-36 mt-8">
                <p className="text-text-medium font-bold text-strongText">
                    פרט לא תקין? שלח את הכרטיס לבדיקה כדי שנתקן את הפרטים.
                </p>

                <div className="flex flex-col items-center gap-2 ">
                    <button 
                        className="btn w-full h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[1px] text-text-large font-normal"
                    >
                        הוסף כרטיס
                    </button>

                    <label className="link link-hover text-primary border-transparent text-text-large font-normal cursor-pointer">
                        שלח לבדיקה
                    </label>
                </div>
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
                    פרסום כרטיס  
                </button>
            </div>
        </div>
        
    );
};

export default StepThreeUploadTicket;
