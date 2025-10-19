import Image from "next/image";
import { useState, useEffect } from "react";
import ShekelsIcon from "@/public/images/Dialogs/shekelsicon.svg";
import { UploadTicketInterface } from "./UploadTicketInterface.types";
import CustomInput from "@/app/components/CustomInput/CustomInput";

const StepTwoUploadTicket: React.FC<UploadTicketInterface> = ({
  nextStep,
  prevStep,
  ticketData,
  updateTicketData,
}) => {
  // State management
  const [askingPrice, setAskingPrice] = useState<string>("");

  // Initialize values from ticketData
  useEffect(() => {
    console.log("StepTwo - ticketData received:", ticketData);

    // Try to get price from extracted ticket details first
    if (ticketData?.ticketDetails?.price && !askingPrice) {
      console.log(
        "StepTwo - Setting extracted price:",
        ticketData.ticketDetails.price
      );
      setAskingPrice(ticketData.ticketDetails.price.toString());
      updatePricingData(ticketData.ticketDetails.price.toString());
    }
    // Otherwise check if there's already a saved pricing value
    else if (ticketData?.pricing?.askingPrice) {
      console.log(
        "StepTwo - Setting saved price:",
        ticketData.pricing.askingPrice
      );
      setAskingPrice(ticketData.pricing.askingPrice.toString());
    }
  }, [ticketData]);

  // Update pricing data in parent component
  const updatePricingData = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d.]/g, "")) || 0;

    if (updateTicketData) {
      updateTicketData({
        pricing: {
          ...ticketData?.pricing,
          askingPrice: numericValue,
        },
      });
    }
  };

  // Handle input changes
  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, "");
    setAskingPrice(numericValue);
    updatePricingData(numericValue);
  };

  // Validation
  const isValidPrice = (price: string) => {
    const num = parseFloat(price);
    return !isNaN(num) && num > 0;
  };

  const canProceed = isValidPrice(askingPrice);

  // Original price notification
  // const PriceNotification = () => {
  //   const extractedPrice =
  //     ticketData?.ticketDetails?.price ||
  //     ticketData?.ticketDetails?.originalPrice;
  //   return extractedPrice ? (
  //     <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
  //       <p className="text-sm text-blue-700">
  //         <span className="font-semibold">מחיר מקורי שזוהה:</span> ₪
  //         {extractedPrice}
  //       </p>
  //     </div>
  //   ) : null;
  // };

  return (
    <div className="w-full max-w-[518px] mt-6 sm:mt-12 px-4 sm:px-0 mx-auto">
      <div className="space-y-2">
        <h2 className="text-lg sm:text-heading-5-desktop font-bold">
          תמחור כרטיס
        </h2>
        <p className="text-sm sm:text-text-medium font-bold text-strongText">
          הזן את המחיר המבוקש עבור הכרטיס.
        </p>
      </div>

      {/* <PriceNotification /> */}

      <div className="w-full max-w-[456px] mx-auto space-y-4 mt-7">
        <CustomInput
          id="ticket-price"
          name="ticket-price"
          width="w-full"
          placeholder="מחיר לכרטיס"
          value={askingPrice}
          onChange={(e) => handlePriceChange(e.target.value)}
          image={<Image src={ShekelsIcon} alt="shekels-icon" />}
        />

        <div className="flex justify-center gap-4 sm:gap-10 mt-8">
          <button
            type="button"
            className="btn w-[120px] sm:w-[140px] h-[46px] min-h-0 btn-secondary bg-white text-primary border-primary border-[2px] text-sm sm:text-text-large font-normal"
            onClick={prevStep}
          >
            לשלב הקודם
          </button>

          <button
            type="button"
            className={`btn w-[120px] sm:w-[140px] h-[46px] min-h-0 btn-secondary text-sm sm:text-text-large font-normal ${
              canProceed
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-secondary text-white cursor-not-allowed"
            }`}
            onClick={() => canProceed && nextStep?.()}
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
