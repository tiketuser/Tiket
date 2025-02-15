import Image from "next/image";

import { UploadTicketInterface } from "./UploadTicketInterface.types";


const StepThreeUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep 
}) => {
    return (
        <div>
            <div className="w-[518px] mt-12">

                {/* Title and Subtitle */}
                <p className="text-heading-5-desktop font-bold">
                    פרסום כרטיס
                </p>
                <p className="text-text-medium font-bold text-strongText">
                    בפניך מוצג הכרטיס עם כל הפרטים כפי שנרשמו במערכת. בדוק שהפרטים נכונים, אם הכל בסדר, אשר את הכרטיס להעלאה למכירה.            
                </p>         
            </div> 

            <p className="text-text-medium font-bold text-strongText">
                פרט לא תקין? שלח את הכרטיס לבדיקה כדי שנתקן את הפרטים.
            </p>

            <div className="flex flex-col items-center gap-2">
                <button 
                    className="btn w-[668px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[1px] text-text-large font-normal"
                >
                    הוסף כרטיס
                </button>

                <label className="link link-hover text-primary border-transparent text-text-large font-normal cursor-pointer">
                    שלח לבדיקה
                </label>
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
        </div>
        
    );
};

export default StepThreeUploadTicket;
