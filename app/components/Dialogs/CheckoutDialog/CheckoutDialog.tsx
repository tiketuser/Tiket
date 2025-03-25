import React from 'react';
import CheckoutUserDialog from './CheckoutUserDialog/CheckoutUserDialog';
import CheckoutGuestDialog from './CheckoutGuestDialog/CheckoutGuestDialog';
import ThankYou from './ThankYou/ThankYou';

interface CheckoutDialogInterface {
    isUserConnected: boolean;
    isOpen: boolean;
    onClose: () => void;
    checkoutSuccess: boolean;
}

const CheckoutDialog: React.FC<CheckoutDialogInterface> = ({
    isUserConnected,
    isOpen,
    onClose,
    checkoutSuccess,
}) => {
    if (checkoutSuccess) {
        return <ThankYou isOpen={isOpen} onClose={onClose} />;
    }
    return isUserConnected ? 
        <CheckoutUserDialog isOpen={isOpen} onClose={onClose}/> : 
        <CheckoutGuestDialog isOpen={isOpen} onClose={onClose}/>;
};

export default CheckoutDialog;