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

            {/* Essential Fields Only */}
            <div className="space-y-6 mt-8 w-[600px]">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">פרטי האירוע</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">כותרת האירוע *</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">תאריך *</label>
                            <CustomInput 
                                id="date"
                                name="date"
                                width="w-full"
                                placeholder="15 אוק׳"
                                value={editableDetails.date}
                                onChange={(e) => handleDetailChange('date', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">מקום</label>
                            <CustomInput 
                                id="venue"
                                name="venue"
                                width="w-full"
                                placeholder="היכל התרבות - תל אביב"
                                value={editableDetails.venue}
                                onChange={(e) => handleDetailChange('venue', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">שעה</label>
                            <CustomInput 
                                id="time"
                                name="time"
                                width="w-full"
                                placeholder="20:00"
                                value={editableDetails.time}
                                onChange={(e) => handleDetailChange('time', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">מיקום המושב</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">יציע</label>
                            <CustomInput 
                                id="section"
                                name="section"
                                width="w-full"
                                placeholder="4"
                                value={editableDetails.section}
                                onChange={(e) => handleDetailChange('section', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">שורה</label>
                            <CustomInput 
                                id="row"
                                name="row"
                                width="w-full"
                                placeholder="24"
                                value={editableDetails.row}
                                onChange={(e) => handleDetailChange('row', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">מקום</label>
                            <CustomInput 
                                id="seat"
                                name="seat"
                                width="w-full"
                                placeholder="15"
                                value={editableDetails.seat}
                                onChange={(e) => handleDetailChange('seat', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Summary */}
            {ticketData?.pricing && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6 w-[600px]">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">💰 סיכום תמחור</h3>
                    <div className="space-y-2">
                        <p className="text-green-700 text-lg font-semibold">מחיר מבוקש: ₪{ticketData.pricing.askingPrice}</p>
                        {ticketData.pricing.allowPriceSuggestions && (
                            <p className="text-green-600">
                                מאפשר הצעות מחיר: ₪{ticketData.pricing.minPrice} - ₪{ticketData.pricing.maxPrice}
                            </p>
                        )}
                    </div>
                </div>
            )}


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
