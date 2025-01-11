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

                <form >
                    <CustomInput placeholder="דואר אלקטרוני / מספר טלפון" className="pt-9" />
                    <CustomInput type="password" placeholder="סיסמא" className="pt-6"/>
                    

                    <div className="flex justify-center pt-9">
                        <div className="grid grid-cols-1 w-[448px]  gap-2">
                            <div>
                                <button className="btn w-full btn-secondary bg-primary text-white text-text-regular">
                                    התחבר
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <CheckBox />
                                <a href="#" className="text-text-regular text-gray-950 underline ">
                                    שכחת סיסמא?
                                </a>
                            </div>
                        </div>
                    </div>

                    <LoginRegisterButtons className="pt-14" />
                    
                </form>
            </div>
        </AdjustableDialog>
    )
}

export default LoginDialog