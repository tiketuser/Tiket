import Image from "next/image";
import { useState, useEffect } from "react";
import ShekelsIcon from "@/public/images/Dialogs/shekelsicon.svg";

import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";

import CheckBox from "@/app/components/CheckBox/CheckBox";
import ToggleCheckBox from "@/app/components/CheckBox/ToggleCheckBox";

const StepTwoUploadTicket: React.FC<UploadTicketInterface> = ({
    nextStep,
    prevStep,
    ticketData,
    updateTicketData
}) => {
    const [askingPrice, setAskingPrice] = useState<string>("");
    const [allowPriceSuggestions, setAllowPriceSuggestions] = useState<boolean>(false);
    const [minPrice, setMinPrice] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");

    // Load existing pricing data when component mounts
    useEffect(() => {
        if (ticketData?.pricing) {
            setAskingPrice(ticketData.pricing.askingPrice?.toString() || "");
            setAllowPriceSuggestions(ticketData.pricing.allowPriceSuggestions || false);
            setMinPrice(ticketData.pricing.minPrice?.toString() || "");
            setMaxPrice(ticketData.pricing.maxPrice?.toString() || "");
        }
        
        // If we have an original price from OCR, suggest it as starting price
        if (ticketData?.ticketDetails?.originalPrice && !askingPrice) {
            setAskingPrice(ticketData.ticketDetails.originalPrice.toString());
        }
    }, [ticketData, askingPrice]);

    const handlePriceChange = (value: string, field: 'asking' | 'min' | 'max') => {
        // Remove non-numeric characters except decimals
        const numericValue = value.replace(/[^\d.]/g, '');
        
        switch (field) {
            case 'asking':
                setAskingPrice(numericValue);
                break;
            case 'min':
                setMinPrice(numericValue);
                break;
            case 'max':
                setMaxPrice(numericValue);
                break;
        }
        
        // Update ticket data
        if (updateTicketData) {
            updateTicketData({
                pricing: {
                    ...ticketData?.pricing,
                    askingPrice: field === 'asking' ? parseFloat(numericValue) || 0 : ticketData?.pricing?.askingPrice,
                    minPrice: field === 'min' ? parseFloat(numericValue) || 0 : ticketData?.pricing?.minPrice,
                    maxPrice: field === 'max' ? parseFloat(numericValue) || 0 : ticketData?.pricing?.maxPrice,
                    allowPriceSuggestions
                }
            });
        }
    };

    const handleAllowSuggestionsChange = (checked: boolean) => {
        setAllowPriceSuggestions(checked);
        if (updateTicketData) {
            updateTicketData({
                pricing: {
                    ...ticketData?.pricing,
                    askingPrice: parseFloat(askingPrice) || 0,
                    allowPriceSuggestions: checked,
                    minPrice: parseFloat(minPrice) || 0,
                    maxPrice: parseFloat(maxPrice) || 0
                }
            });
        }
    };

    const canProceed = askingPrice && parseFloat(askingPrice) > 0;

    return (
        <div className="w-full max-w-[518px] mt-6 sm:mt-12 px-4 sm:px-0 mx-auto">

            {/* Title and Subtitle */}
            <p className="text-lg sm:text-heading-5-desktop font-bold">תמחור כרטיס</p>
            <p className="text-sm sm:text-text-medium font-bold text-strongText">
                תוכל לאפשר לקונים להציע מחירים נמוכים יותר או להציע מחיר קבוע בלבד.
            </p>    
            
            {/* Show original price if extracted from OCR */}
            {ticketData?.ticketDetails?.originalPrice && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-blue-700">
                        <span className="font-semibold">מחיר מקורי שזוהה:</span> ₪{ticketData.ticketDetails.originalPrice}
                    </p>
                </div>
            )}

            <div className="w-full max-w-[456px] mx-auto block mt-7">
                {/* Price Input */}
                <CustomInput 
                    id="ticket-price" 
                    name="ticket-price"
                    width="w-full" 
                    placeholder="מחיר לכרטיס" 
                    value={askingPrice}
                    onChange={(e) => handlePriceChange(e.target.value, 'asking')}
                    image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                />
                
                <div className="mt-4">
                    <CheckBox 
                        text="אפשר הצעת מחיר"
                        checked={allowPriceSuggestions}
                        onChange={handleAllowSuggestionsChange}
                    />
                </div>

                {/* Min - Max Price Inputs (Stacked on mobile, horizontal on desktop) - Only show if price suggestions are enabled */}
                {allowPriceSuggestions && (
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mx-auto mt-4">
                        <CustomInput 
                            id="min-price" 
                            name="min-price"
                            width="w-full sm:w-[212px]" 
                            placeholder="מחיר מינימום" 
                            value={minPrice}
                            onChange={(e) => handlePriceChange(e.target.value, 'min')}
                            image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                        />
                        <CustomInput 
                            id="max-price" 
                            name="max-price"
                            width="w-full sm:w-[212px]" 
                            placeholder="מחיר מקסימום" 
                            value={maxPrice}
                            onChange={(e) => handlePriceChange(e.target.value, 'max')}
                            image={<Image src={ShekelsIcon} alt="shekels-icon" />}
                        />
                    </div>
                )}

                {/* Toggle Checkbox at the Bottom */}
                <div className="mt-2">
                    <ToggleCheckBox />
                </div>

                <div className="flex justify-center gap-4 sm:gap-10 mt-8 sm:mt-14">
                    <button 
                        type="button"
                        className="btn w-[120px] sm:w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
                        onClick={() => prevStep && prevStep()}
                    >
                        לשלב הקודם
                    </button>

                    <button 
                        type="button"
                        className={`btn w-[120px] sm:w-[140px] h-[46px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
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
                        לשלב הבא   
                    </button>
                </div>      
            </div>
        </div>
    );
};

export default StepTwoUploadTicket;