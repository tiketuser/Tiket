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
        <div className="h-full flex flex-col">
            <div className="w-[668px] mt-4 pr-36">
                {/* Title and Subtitle */}
                <p className="text-heading-5-desktop font-bold">
                    אשר את הפרטים
                </p>
                <p className="text-text-medium font-bold text-strongText">
                    בדוק את פרטי הכרטיס לפני הפרסום. ודא שכל המידע נכון ומלא.            
                </p>         
            </div> 

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {/* Preview Card */}
                <div className="mt-4">
                    <MinimalCard 
                        price={ticketData?.pricing?.askingPrice || 0}
                        title={editableDetails.artist || editableDetails.title || "ללא כותרת"}
                        date={editableDetails.date || "ללא תאריך"}
                        seatLocation={formatSeatLocation()}
                        width="w-[800px]"
                    />
                </div>

                {/* Compact Centered Form */}
                <div className="mt-6 w-[500px] mx-auto space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת האירוע *</label>
                            <CustomInput 
                                id="title"
                                name="title"
                                width="w-[240px]"
                                placeholder="שם האמן/אירוע"
                                value={editableDetails.title}
                                onChange={(e) => handleDetailChange('title', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">תאריך *</label>
                            <CustomInput 
                                id="date"
                                name="date"
                                width="w-[240px]"
                                placeholder="15 אוק׳"
                                value={editableDetails.date}
                                onChange={(e) => handleDetailChange('date', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">מקום</label>
                            <CustomInput 
                                id="venue"
                                name="venue"
                                width="w-[240px]"
                                placeholder="היכל התרבות - תל אביב"
                                value={editableDetails.venue}
                                onChange={(e) => handleDetailChange('venue', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">שעה</label>
                            <CustomInput 
                                id="time"
                                name="time"
                                width="w-[240px]"
                                placeholder="20:00"
                                value={editableDetails.time}
                                onChange={(e) => handleDetailChange('time', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">יציע</label>
                            <CustomInput 
                                id="section"
                                name="section"
                                width="w-[160px]"
                                placeholder="4"
                                value={editableDetails.section}
                                onChange={(e) => handleDetailChange('section', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">שורה</label>
                            <CustomInput 
                                id="row"
                                name="row"
                                width="w-[160px]"
                                placeholder="24"
                                value={editableDetails.row}
                                onChange={(e) => handleDetailChange('row', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">מקום</label>
                            <CustomInput 
                                id="seat"
                                name="seat"
                                width="w-[160px]"
                                placeholder="15"
                                value={editableDetails.seat}
                                onChange={(e) => handleDetailChange('seat', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Pricing Summary */}
                    {ticketData?.pricing && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-4">
                            <p className="text-primary font-semibold text-sm">מחיר מבוקש: ₪{ticketData.pricing.askingPrice}</p>
                            {ticketData.pricing.allowPriceSuggestions && (
                                <p className="text-primary/70 text-xs">
                                    מאפשר הצעות: ₪{ticketData.pricing.minPrice} - ₪{ticketData.pricing.maxPrice}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Buttons at Bottom */}
            <div className="flex justify-center gap-10 py-4 border-t bg-white">
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
