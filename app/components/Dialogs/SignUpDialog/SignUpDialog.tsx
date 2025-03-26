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
            width="xlg:w-[880px] lg:w-[750px] w-[360px]"
            height="xlg:h-[835px] h-[560px]"
            isOpen={isOpen}
            onClose={onClose}
            heading="הירשם"
            description="הירשם בכדי לקנות ולמכור כרטיסים"
        >
                <form className="grid place-items-center grid-cols-2 sm:w-[456px] w-[256px] sm:gap-x-7 gap-x-2"
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
                        width="sm:w-[456px] w-[256px]" 
                        className="col-span-2 xlg:mt-10 mt-4"
                        required={true}
                    />
                    <CustomInput 
                        id="phone" 
                        type="phone"
                        pattern="^\d{10}$"
                        placeholder="מספר טלפון" 
                        width="sm:w-[456px] w-[256px]" 
                        className="col-span-2 xlg:mt-6 mt-4"
                        image={<Image src={PhoneInputIcon} alt="PhoneInputIcon"/>}
                        required={true}
                    />
                    <CustomInput 
                        id="fname" 
                        type="text" 
                        required= {true}
                        placeholder="שם פרטי" 
                        width="w-full" 
                        className="xlg:mt-10 mt-4"
                        pattern="^\S+$"
                    />
                    <CustomInput 
                        id="lname" 
                        type="text" 
                        placeholder="שם משפחה" 
                        width=" w-full" 
                        className="xlg:mt-10 mt-4"
                        required={true}
                        pattern="^\S+$"
                    />
                    <CustomInput 
                        id="password" 
                        type="password" 
                        placeholder="סיסמא" 
                        width="w-full" 
                        className="xlg:mt-6 mt-4"
                        required={true}
                    />
                    <CustomInput 
                        id="re-password" 
                        type="password" 
                        placeholder="אשר סיסמא" 
                        width="w-full" 
                        className="xlg:mt-6 mt-4"
                        required={true}
                    />

                    <button type="submit" 
                        id="submitButton"
                        className="btn sm:w-[456px] w-[256px] xlg:h-[48px] h-[32px] min-h-0 xlg:mt-10 mt-4 btn-secondary bg-primary col-span-2 disabled:bg-secondary disabled:text-white"
                        disabled
                    >
                        <label className="text-white font-light xlg:text-text-large text-text-small">
                            הירשם
                        </label>
                    </button>

                    <div className="col-span-2 p-3">
                        <CheckBox 
                            text="אני מאשר את תנאי השימוש"
                            required={true}/>
                    </div>

                </form>

                <LoginRegisterButtons className="xlg:mt-14" />



        </AdjustableDialog>
    )

}

export default SignUpDialog