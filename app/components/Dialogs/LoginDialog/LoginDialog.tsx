import AdjustableDialog from "../AdjustableDialog/AdjustableDialog"
import CustomInput from "../../CustomInput/CustomInput"
import LoginRegisterButtons from "../LoginRegisterButtons/LoginRegisterButtons";

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
            <div className="">
                {/* Header */}
                <h2 className="text-center text-heading-1-desktop font-extrabold text-gray-950">
                    התחברות
                </h2>
                <p className="text-center text-heading-5-desktop font-bold text-strongText">
                    התחבר בכדי לקנות ולמכור כרטיסים
                </p>

                {/* Login form */}
                <form className="">

                    <CustomInput placeholder="דואר אלקטרוני / מספר טלפון" />
                    <CustomInput type="password" placeholder="סיסמא" />
                    <LoginRegisterButtons />



                    {/* Remember Me and Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center text-sm text-gray-600">
                            <input
                                type="checkbox"
                                className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2">זכור אותי</span>
                        </label>
                        <a href="#" className="text-sm text-blue-500 hover:underline">
                            שכחת סיסמא?
                        </a>
                    </div>
                </form>
            </div>
        </AdjustableDialog>
    )
}

export default LoginDialog