import AdjustableDialog from "../AdjustableDialog/AdjustableDialog"
import CustomInput from "../../CustomInput/CustomInput"
import LoginRegisterButtons from "../LoginRegisterButtons/LoginRegisterButtons";
import CheckBox from "../../CheckBox/CheckBox";
import LoginSigninButton from "../LoginSigninButton/LoginSigninButton";


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
            width="sm:w-[880px] w-[400px]"
            height="sm:h-[675px] h-[450px]"
            heading="התחבר"
            description="התחבר בכדי לקנות כרטיסים"
            isOpen={isOpen}
            onClose={onClose}
        >
                <form className="flex flex-col items-center"
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
                        className="sm:pt-9"
                        width="sm:w-[456px] w-[256px]" 
                    />
                    <CustomInput 
                        id='password' 
                        required={true}
                        type="password"
                        placeholder="סיסמא" 
                        className="pt-6" 
                        width="sm:w-[456px] w-[256px]"
                    />
                    

                    <div className="pt-9">
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <button 
                                    id="submitButton"
                                    className="btn sm:w-[456px] w-[256px] sm:h-[48px] h-[32px] min-h-0 btn-secondary bg-primary text-white sm:text-text-large text-text-small disabled:bg-secondary disabled:text-white"
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
                        className="sm:pt-14"
                        redButton="הירשם"
                        grayButton="התחבר"
                    />
                    
                </form>

        </AdjustableDialog>
    )
}

export default LoginDialog