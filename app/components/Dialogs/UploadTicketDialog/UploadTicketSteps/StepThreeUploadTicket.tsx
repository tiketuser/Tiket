import { useState, useEffect } from "react";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";

const StepThreeUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep,
    ticketData,
    updateTicketData
}) => {
    // Local state for editable fields
    const [editableDetails, setEditableDetails] = useState({
        title: "",
        artist: "",
        date: "",
        time: "",
        venue: "",
        seat: "",
        row: "",
        section: "",
        barcode: ""
    });

    // Load ticket details when component mounts
    useEffect(() => {
        if (ticketData?.ticketDetails) {
            setEditableDetails({
                title: ticketData.ticketDetails.title || "",
                artist: ticketData.ticketDetails.artist || "",
                date: ticketData.ticketDetails.date || "",
                time: ticketData.ticketDetails.time || "",
                venue: ticketData.ticketDetails.venue || "",
                seat: ticketData.ticketDetails.seat || "",
                row: ticketData.ticketDetails.row || "",
                section: ticketData.ticketDetails.section || "",
                barcode: ticketData.ticketDetails.barcode || ""
            });
        }
    }, [ticketData]);

    const handleDetailChange = (field: string, value: string) => {
        setEditableDetails(prev => ({
            ...prev,
            [field]: value
        }));

        // Update ticket data
        if (updateTicketData) {
            updateTicketData({
                ticketDetails: {
                    ...ticketData?.ticketDetails,
                    [field]: value
                }
            });
        }
    };

    const formatSeatLocation = () => {
        const parts = [];
        if (editableDetails.section) parts.push(`יציע ${editableDetails.section}`);
        if (editableDetails.row) parts.push(`שורה ${editableDetails.row}`);
        if (editableDetails.seat) parts.push(`מקום ${editableDetails.seat}`);
        return parts.join(' ') || "מיקום לא צוין";
    };

    const canProceed = editableDetails.title && 
                       editableDetails.date && 
                       ticketData?.pricing?.askingPrice;

    return (
        <div>
            <div className="w-[668px] mt-12 pr-36">
                {/* Title and Subtitle */}
                <p className="text-heading-5-desktop font-bold">
                    אימות פרטי כרטיס
                </p>
                <p className="text-text-medium font-bold text-strongText">
                    בדוק ותקן את הפרטים שחולצו מהכרטיס. ודא שכל המידע נכון לפני הפרסום.            
                </p>         
            </div> 

            {/* Show extracted text for reference */}
            {ticketData?.extractedText && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4 mr-36 w-[600px]">
                    <p className="text-sm font-semibold text-gray-700 mb-2">טקסט שחולץ מהתמונה:</p>
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">{ticketData.extractedText}</p>
                </div>
            )}

            {/* Preview Card */}
            <div className="mt-8">
                <p className="text-text-medium font-bold mb-4">תצוגה מקדימה:</p>
                <MinimalCard 
                    price={ticketData?.pricing?.askingPrice || 0}
                    title={editableDetails.artist || editableDetails.title || "ללא כותרת"}
                    date={editableDetails.date || "ללא תאריך"}
                    seatLocation={formatSeatLocation()}
                    width="w-[880px]"
                />
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-2 gap-4 mt-8 w-[800px]">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">כותרת האירוע</label>
                    <CustomInput 
                        id="title"
                        name="title"
                        width="w-full"
                        placeholder="שם האמן/אירוע"
                        value={editableDetails.title}
                        onChange={(e) => handleDetailChange('title', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">אמן</label>
                    <CustomInput 
                        id="artist"
                        name="artist"
                        width="w-full"
                        placeholder="שם האמן"
                        value={editableDetails.artist}
                        onChange={(e) => handleDetailChange('artist', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                    <CustomInput 
                        id="date"
                        name="date"
                        width="w-full"
                        placeholder="תאריך האירוע"
                        value={editableDetails.date}
                        onChange={(e) => handleDetailChange('date', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שעה</label>
                    <CustomInput 
                        id="time"
                        name="time"
                        width="w-full"
                        placeholder="שעת האירוע"
                        value={editableDetails.time}
                        onChange={(e) => handleDetailChange('time', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מקום</label>
                    <CustomInput 
                        id="venue"
                        name="venue"
                        width="w-full"
                        placeholder="שם המקום"
                        value={editableDetails.venue}
                        onChange={(e) => handleDetailChange('venue', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">יציע</label>
                    <CustomInput 
                        id="section"
                        name="section"
                        width="w-full"
                        placeholder="מספר יציע"
                        value={editableDetails.section}
                        onChange={(e) => handleDetailChange('section', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שורה</label>
                    <CustomInput 
                        id="row"
                        name="row"
                        width="w-full"
                        placeholder="מספר שורה"
                        value={editableDetails.row}
                        onChange={(e) => handleDetailChange('row', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מקום</label>
                    <CustomInput 
                        id="seat"
                        name="seat"
                        width="w-full"
                        placeholder="מספר מקום"
                        value={editableDetails.seat}
                        onChange={(e) => handleDetailChange('seat', e.target.value)}
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ברקוד</label>
                    <CustomInput 
                        id="barcode"
                        name="barcode"
                        width="w-full"
                        placeholder="מספר ברקוד"
                        value={editableDetails.barcode}
                        onChange={(e) => handleDetailChange('barcode', e.target.value)}
                    />
                </div>
            </div>

            {/* Pricing Summary */}
            {ticketData?.pricing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 w-[800px]">
                    <h3 className="font-semibold text-blue-800 mb-2">סיכום תמחור:</h3>
                    <p className="text-blue-700">מחיר מבוקש: ₪{ticketData.pricing.askingPrice}</p>
                    {ticketData.pricing.allowPriceSuggestions && (
                        <p className="text-blue-700">
                            טווח הצעות: ₪{ticketData.pricing.minPrice} - ₪{ticketData.pricing.maxPrice}
                        </p>
                    )}
                </div>
            )}

            <div className="w-[600px] mr-36 mt-8">
                <p className="text-text-medium font-bold text-strongText">
                    פרט לא תקין? ערוך את השדות למעלה או שלח לבדיקה ידנית.
                </p>

                <div className="flex flex-col items-center gap-2 mt-4">
                    <label className="link link-hover text-primary border-transparent text-text-large font-normal cursor-pointer">
                        שלח לבדיקה ידנית
                    </label>
                </div>
            </div>


            <div className="flex justify-center gap-10 mt-14">
                <button 
                    type="button"
                    className="btn w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-text-large font-normal"
                    onClick={() => prevStep && prevStep()}
                >
                    לשלב הקודם
                </button>

                <button 
                    type="button"
                    className={`btn w-[140px] h-[46px] min-h-0 btn-secondary text-text-large font-normal ${
                        canProceed 
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'bg-secondary text-white cursor-not-allowed'
                    }`}
                    onClick={() => {
                        if (canProceed && nextStep) {
                            nextStep();
                        }
                    }}
                    disabled={!canProceed}
                >
                    פרסום כרטיס
                </button>
            </div>
        </div>
        
    );
};

export default StepThreeUploadTicket;
