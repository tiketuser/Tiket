import AdjustableDialog from "../AdjustableDialog/AdjustableDialog"
import CustomInput from "../../CustomInput/CustomInput"
import LoginRegisterButtons from "../LoginRegisterButtons/LoginRegisterButtons";
import CheckBox from "../../CheckBox/CheckBox";


interface LoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
}
const LoginDialog: React.FC<LoginDialogProps> = ({
    isOpen,
    onClose
}) => {
    return (
        <AdjustableDialog
            width="w-[880px]"
            height="h-[675px]"
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="  select-none">
                {/* Header */}
                <h2 className="text-center text-heading-1-desktop font-extrabold text-gray-950">
                    התחברות
                </h2>
                <p className="text-center text-heading-5-desktop font-bold text-strongText">
                    התחבר בכדי לקנות ולמכור כרטיסים
                </p>

                <form 
                    onChange={(e) => {
                        const form = e.currentTarget;
                        const button = document.getElementById("submitButton") as HTMLButtonElement;
                        if (button) {
                        button.disabled = !form.checkValidity();
                        }
                    }}
                
                >
                    <CustomInput 
                        id='phoneemail' 
                        required={true}
                        placeholder="דואר אלקטרוני / מספר טלפון" 
                        className="pt-9"
                         width="456px" 
                    />
                    <CustomInput 
                        id='password' 
                        required={true}
                        type="password" 
                        placeholder="סיסמא" 
                        className="pt-6" 
                        width="456px"
                    />
                    

                    <div className="flex justify-center pt-9">
                        <div className="grid grid-cols-1 w-[456px] gap-2">
                            <div>
                                <button 
                                    id="submitButton"
                                    className="btn w-full btn-secondary bg-primary text-white text-text-regular disabled:bg-secondary disabled:text-white"
                                    disabled
                                >
                                    התחבר
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <CheckBox/>
                                <a href="#" className="text-text-regular text-gray-950 underline ">
                                    שכחת סיסמא?
                                </a>
                            </div>
                        </div>
                    </div>

                    <LoginRegisterButtons 
                        className="pt-14"
                        redButton="הירשם"
                        grayButton="התחבר"
                    />
                    
                </form>
            </div>
        </AdjustableDialog>
    )
}

export default LoginDialog