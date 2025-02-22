import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";

interface PaymentDialogInterface {
    isOpen: boolean;
    onClose: () => void;
}

const PaymentDialog: React.FC<PaymentDialogInterface> = ({
    isOpen, onClose
}) => {
    return (
        <AdjustableDialog isOpen={isOpen} onClose={onClose}>
            <p>motha</p>
        </AdjustableDialog>
    );
};

export default PaymentDialog;