import Image from "next/image";

import AdjustableDialog from "../../AdjustableDialog/AdjustableDialog";
import MinimalCard from "../../../MinimalCard/MinimalCard";
import BoxThing from "../../../BoxThing/BoxThing";
import CustomInput from "../../../CustomInput/CustomInput";

import ApplePayIcom from "@/public/images/Dialogs/ApplePayIcon.svg";
import VisaIcon from "@/public/images/Dialogs/VisaIcon.svg";
import MasterCardIcon from "@/public/images/Dialogs/MasterCardIcon.svg";
import GPayIcon from "@/public/images/Dialogs/GPayIcon.svg";
import PayPalIcon from "@/public/images/Dialogs/PayPalIcon.svg";

interface CheckoutUserDialogInterface {
    isOpen: boolean;
    onClose: () => void;
}

const CheckoutUserDialog: React.FC<CheckoutUserDialogInterface> = ({
    isOpen, onClose
}) => {
    return (
        <AdjustableDialog 
            isOpen={isOpen} 
            onClose={onClose}
            width="w-[880px]"
            height="h-[900px]"
            heading="אשר הזמנה"
            description="בחר שיטת תשלום">
            
            <div className="flex flex-col items-center space-y-5 w-full">
                <BoxThing>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-heading-5-desktop">כרטיס אשראי</h2>

                            <div className="flex gap-2">
                                <Image src={VisaIcon} alt="Visa" />
                                <Image src={MasterCardIcon} alt="Mastercard" />
                            </div>
                        
                    </div>

                    <form className="flex flex-col items-center w-full">
                        <div className="grid grid-cols-2 gap-4 w-[456px]">
                            <CustomInput 
                                id="card-number"
                                type="text"
                                placeholder="מספר כרטיס אשראי"
                                width="w-full"
                                className="col-span-2"
                                required={true}
                            />
                        
                            <CustomInput 
                                id="cvv"
                                type="text"
                                width="w-full"
                                placeholder="CVV"
                                required={true}
                            />

                            <CustomInput 
                                id="expiry"
                                type="text"
                                width="w-full"
                                placeholder="תוקף הכרטיס"
                                required={true}
                            />
                        </div>

                        <button type="submit" 
                            id="submitButton"
                            className="btn sm:w-[456px] w-[256px] sm:h-[48px] h-[32px] min-h-0 sm:mt-7 mt-4 btn-secondary bg-primary text-white text-text-regular col-span-2 disabled:bg-secondary disabled:text-white"
                            disabled
                        >
                            שלם עכשיו
                        </button>
                    </form>
                </BoxThing>

                <BoxThing height="h-[72px]" href="https://www.apple.com/apple-pay/">
                    <div className="flex items-center justify-between h-full">
                        <Image src={ApplePayIcom} alt={ApplePayIcom} />
                        <p className="text-heading-5-desktop font-bold">Apple Pay</p>    
                    </div>
                </BoxThing>

                <BoxThing height="h-[72px]" href="https://pay.google.com/intl/iw_il/about/">
                    <div className="flex items-center justify-between h-full">
                        <Image src={GPayIcon} alt={GPayIcon} />
                        <p className="text-heading-5-desktop font-bold">Google Pay</p>    
                    </div>
                </BoxThing>

                <BoxThing height="h-[72px]" href="https://www.paypal.com/il/home">
                    <div className="flex items-center justify-between h-full">
                        <Image src={PayPalIcon} alt={PayPalIcon} />
                        <p className="text-heading-5-desktop font-bold">PayPal</p>    
                    </div>
                </BoxThing>
            </div>

            <div className="absolute bottom-1 left-0">
                <MinimalCard 
                    price={500}
                    priceBefore={600}
                    title="עלמה גוב"
                    date="15 אוק׳"
                    seatLocation="היכל התרבות - תל אביב"
                    width="w-[880px]"
                />
            </div>

        </AdjustableDialog>
    );
};

export default CheckoutUserDialog;