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
            width="w-[360px] md:w-[680px] lg:w-[880px] "
            height="h-[460px] md:h-[560px] lg:h-[675px] "
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
                        className="md:pt-9 pt-6"
                        width="md:w-[456px] w-[256px]" 
                    />
                    <CustomInput 
                        id='password' 
                        required={true}
                        type="password"
                        placeholder="סיסמא" 
                        className="pt-6" 
                        width="w-[256px] md:w-[456px] "
                    />
                    

                    <div className="md:pt-9 pt-6">
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <button 
                                    id="submitButton"
                                    className="btn md:w-[456px] w-[256px] md:h-[48px] h-[32px] min-h-0 btn-secondary bg-primary text-white md:text-text-large text-text-small disabled:bg-secondary disabled:text-white"
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
                </form>
                
                <LoginRegisterButtons 
                        className="lg:mt-14 md:mt-9 mt-6"
                        redButton="הירשם"
                        grayButton="התחבר"
                />
                
        </AdjustableDialog>
    )
}

export default LoginDialog