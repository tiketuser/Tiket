import React from "react";

import AdjustableDialog from "../AdjustableDialog/AdjustableDialog"
import CustomInput from "../../CustomInput/CustomInput";

interface LoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const SignUpDialog: React.FC<LoginDialogProps> = ({
    isOpen,
    onClose
}) => {
    return (
        <AdjustableDialog
            width="w-[880px]"
            height="h-[835px]"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="select-none">
                {/* Header */}
                <h2 className="text-center text-heading-1-desktop font-extrabold text-gray-950">
                    הרשמה
                </h2>
                <p className="text-center text-heading-5-desktop font-bold text-strongText">
                    הירשם בכדי לקנות ולמכור כרטיסים
                </p>

                <form>
                    <CustomInput type="email" placeholder="דואר אלקטרוני" className="pt-9" />
                    <CustomInput type="phone" placeholder="מספר טלפון" className="pt-6"/>
                </form>
            </div>

        </AdjustableDialog>
    )

}

export default SignUpDialog