import AdjustableDialog from "../AdjustableDialog/AdjustableDialog"

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
            <h2 className="text-xl font-bold mb-4">Login Dialog</h2>
            <p>This is the content inside the dialog.</p>
        </AdjustableDialog>
    )
}

export default LoginDialog