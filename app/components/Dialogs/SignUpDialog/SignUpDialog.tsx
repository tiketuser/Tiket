import React from "react";
import Image from "next/image";

import PhoneInputIcon from "../../../../public/images/Dialogs/phoneInput.svg"

import AdjustableDialog from "../AdjustableDialog/AdjustableDialog"
import CustomInput from "../../CustomInput/CustomInput";
import CheckBox from "../../CheckBox/CheckBox";
import LoginRegisterButtons from "../LoginRegisterButtons/LoginRegisterButtons";

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


                <form className="grid place-items-center grid-cols-2 w-[456px] gap-x-7"
                    onChange={(e) => {
                        const form = e.currentTarget;
                        const button = document.getElementById("submitButton") as HTMLButtonElement;
                        if (button) {
                          button.disabled = !form.checkValidity();
                        }
                    }}
                
                >
                    <CustomInput 
                        id="email" 
                        type="email" 
                        placeholder="דואר אלקטרוני" 
                        width="456px" 
                        className="col-span-2 mt-10"
                        required={true}
                    />
                    <CustomInput 
                        id="phone" 
                        type="phone"
                        pattern="^\d{10}$"
                        placeholder="מספר טלפון" 
                        width="456px" 
                        className="col-span-2 mt-6"
                        //image={<Image src={PhoneInputIcon} alt="PhoneInputIcon"/>}
                        required={true}
                    />
                    <CustomInput 
                        id="fname" 
                        type="text" 
                        required= {true}
                        placeholder="שם פרטי" 
                        width="212px" 
                        className="mt-10"
                        pattern="^\S+$"
                    />
                    <CustomInput 
                        id="lname" 
                        type="text" 
                        placeholder="שם משפחה" 
                        width="212px" 
                        className="mt-10"
                        required={true}
                        pattern="^\S+$"
                    />
                    <CustomInput 
                        id="password" 
                        type="password" 
                        placeholder="סיסמא" 
                        width="212px" 
                        className="mt-6"
                        required={true}
                    />
                    <CustomInput 
                        id="re-password" 
                        type="password" 
                        placeholder="אשר סיסמא" 
                        width="212px" 
                        className="mt-6"
                        required={true}
                    />

                    <button type="submit" 
                            id="submitButton"
                            className="btn w-full btn-secondary bg-primary text-white text-text-regular col-span-2 mt-10 disabled:bg-secondary disabled:text-white"
                            disabled>
                        הירשם
                    </button>

                    <div className="col-span-2">
                        <CheckBox 
                            text="אני מאשר את תנאי השימוש"
                            required={true}/>
                    </div>

                </form>

                <LoginRegisterButtons className="mt-14" />

            </div>

        </AdjustableDialog>
    )

}

export default SignUpDialog