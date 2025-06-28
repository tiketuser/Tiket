import Image from "next/image";

import AdjustableDialog from "../../AdjustableDialog/AdjustableDialog";
import MinimalCard from "../../../MinimalCard/MinimalCard";
import BoxThing from "../../../BoxThing/BoxThing";
import CustomInput from "../../../CustomInput/CustomInput";
import CheckBox from "@/app/components/CheckBox/CheckBox";

import ApplePayIcon from "@/public/images/Dialogs/ApplePayIcon.svg";
import VisaIcon from "@/public/images/Dialogs/VisaIcon.svg";
import MasterCardIcon from "@/public/images/Dialogs/MasterCardIcon.svg";
import GPayIcon from "@/public/images/Dialogs/GPayIcon.svg";
//import PayPalIcon from "@/public/images/Dialogs/PayPalIcon.svg";

interface CheckoutGuestDialogInterface {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutGuestDialog: React.FC<CheckoutGuestDialogInterface> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AdjustableDialog
      isOpen={isOpen}
      onClose={onClose}
      width="w-[880px]"
      height="h-[900px]"
      heading="אשר הזמנה"
      description="בחר שיטת תשלום"
    >
      <div className="flex flex-col items-center space-y-6 w-full">
        <BoxThing height="h-[282px]">
          <h2 className="font-bold text-heading-5-desktop">רכישה כאורח</h2>
          <p className="text-text-medium">
            כך תוכל לקבל את הכרטיס שלך מיד לאחר הרכישה
          </p>

          <form className="flex flex-col items-center w-full mt-2">
            <div className="grid grid-cols-2 gap-4 w-[456px]">
              <CustomInput
                id="emailorphone"
                name="emailorphone" // <-- Add this line
                type="text"
                placeholder="דואר אלקטרוני \ מספר טלפון"
                width="w-full"
                className="col-span-2"
                required={true}
              />

              <CustomInput
                id="fname"
                name="fname" 
                type="text"
                width="w-full"
                placeholder="שם פרטי"
                required={true}
              />

              <CustomInput
                id="lname"
                name="lname"
                type="text"
                width="w-full"
                placeholder="שם משפחה"
                required={true}
              />
            </div>

            <div className="pt-4">
              <CheckBox
                text="אני מאשר את תנאי השימוש"
                required={true}
                className="pt-4"
              />
            </div>
          </form>
        </BoxThing>

        <BoxThing height="h-[72px]" href="https://www.apple.com/apple-pay/">
          <div className="flex items-center justify-between h-full">
            <p className="text-heading-5-desktop font-bold">כרטיס אשראי</p>
            <div className="flex gap-4">
              <Image src={VisaIcon} alt={VisaIcon} />
              <Image src={MasterCardIcon} alt={MasterCardIcon} />
            </div>
          </div>
        </BoxThing>

        <BoxThing height="h-[72px]" href="https://www.apple.com/apple-pay/">
          <div className="flex items-center justify-between h-full">
            <Image src={ApplePayIcon} alt={ApplePayIcon} />
            <p className="text-heading-5-desktop font-bold">Apple Pay</p>
          </div>
        </BoxThing>

        <BoxThing
          height="h-[72px]"
          href="https://pay.google.com/intl/iw_il/about/"
        >
          <div className="flex items-center justify-between h-full">
            <Image src={GPayIcon} alt={GPayIcon} />
            <p className="text-heading-5-desktop font-bold">Google Pay</p>
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

export default CheckoutGuestDialog;
