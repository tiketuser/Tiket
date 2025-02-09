import { UploadTicketInterface } from "./UploadTicketInterface.types";

const StepOneUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep
}) => {
    return (
        <div className="w-[668px] h-[236px] mt-12">
            <p className="text-heading-5-desktop font-bold">תמונת כרטיס</p>
            <p className="text-text-medium font-bold">גרור או בחר תמונה של הכרטיס מהמכשיר</p>
            <p className="text-text-medium font-light">ודא שהתמונה ברורה ושכל פרטי הכרטיס נראים היטב.</p>

            <div className="w-[650px] h-[100px] flex items-center gap-4 mt-3">
                <input 
                    type="file" 
                    id="fileUpload"
                    className="hidden"
                />
                <label 
                    htmlFor="fileUpload" 
                    className="cursor-pointer border border-primary text-primary px-4 py-1 rounded-lg text-text-large font-normal"
                >
                    בחר קובץ
                </label>
                <p className="text-text-medium font-normal">לא זוהה קובץ</p>
            </div>
        </div>
    );
};

export default StepOneUploadTicket;
