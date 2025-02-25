import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import MinimalCard from "../../MinimalCard/MinimalCard";

interface CheckoutDialogInterface {
    isOpen: boolean;
    onClose: () => void;
}

const CheckoutDialog: React.FC<CheckoutDialogInterface> = ({
    isOpen, onClose
}) => {
    return (
        <AdjustableDialog 
            isOpen={isOpen} 
            onClose={onClose}
            width="w-[880px]"
            height="h-[1040px]">
            <p>shatz</p>
        </AdjustableDialog>
    );
};

export default CheckoutDialog;