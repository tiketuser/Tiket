import Image from "next/image";

import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";

import EmptyImage from "../../../../../public/images/Dialogs/emptyimage.svg"

const StepOneUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep
}) => {
    return (
        <div className="lg:w-[668px] w-[320px] md:mt-12 mt-5">

            <p className="text-heading-5-mobile md:text-text-medium font-bold">תמונת כרטיס</p>
            <p className="text-text-small md:text-text-medium font-bold">גרור או בחר תמונה של הכרטיס מהמכשיר</p>
            <p className="text-text-small sm:text-text-medium font-light">ודא שהתמונה ברורה ושכל פרטי הכרטיס נראים היטב.</p>

            <div className="w-full flex items-center justify-between lg:mt-3">

                {/* Right side: File input, label, and status text */}
                <div className="flex items-center gap-4">
                    <input 
                        type="file" 
                        id="fileUpload" 
                        className="hidden" 
                    />

                    <button className="btn min-h-0 h-[27px] md:h-[46px] btn-secondary border-primary border-[2px] bg-white text-primary ">
                        <label 
                            htmlFor="fileUpload" 
                            className="text-text-small md:text-text-large font-normal"
                        >
                            בחר קובץ
                        </label>
                    </button>

                    <p className="text-text-small sm:text-text-medium font-normal">
                        לא זוהה קובץ
                    </p>
                </div>

                <div className="w-[50px] h-[50px] lg:w-[100px] lg:h-[100px] relative">
                    <Image 
                        src={EmptyImage}
                        alt="Placeholder"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain"
                        />
                </div>
            </div>

            <div className="lg:border-t-4 border-t-2 lg:mt-6 mt-3 border-highlight w-full"></div>

            <p className="lg:text-heading-5-desktop text-heading-5-mobile font-bold lg:mt-16">קוד ידני</p>
            <p className="lg:text-text-medium text-text-small font-bold">הכנס את קוד הברקוד שעל הכרטיס</p>
            <p className="lg:text-text-medium text-text-small font-light">ודא את המספר כמה פעמים לפני שליחה</p>

            <div className="flex items-center gap-4 mt-6">
                <CustomInput id="barcode" width="w-[392px]" placeholder="מספר ברקוד"/>

                <button className="btn btn-secondary border-primary border-[2px] bg-white text-primary">
                    <label 
                        className="text-text-large font-normal"
                    >
                        העלה כרטיס
                    </label>
                </button> 
            </div>

            <div className="border-t-4 mt-6 border-highlight w-full shadow-2xl"/>

            <button 
                id="nextStep"
                className="btn w-[456px] min-h-0 h-[48px]  btn-secondary bg-primary text-white text-text-large font-normal disabled:bg-secondary disabled:text-white mt-12 mx-auto block"
                onClick={nextStep}
            >
                לשלב הבא   
            </button>
        </div>
    );
};

export default StepOneUploadTicket;
