import React from 'react';
import CheckoutUserDialog from './CheckoutUserDialog/CheckoutUserDialog';
import CheckoutGuestDialog from './CheckoutGuestDialog/CheckoutGuestDialog';

interface CheckoutDialogInterface {
    isUserConnected: boolean;
    isOpen: boolean;
    onClose: () => void;
}

const CheckoutDialog: React.FC<CheckoutDialogInterface> = ({
    isUserConnected,
    isOpen,
    onClose
}) => {
    return isUserConnected ? 
        <CheckoutUserDialog isOpen={isOpen} onClose={onClose}/> : 
        <CheckoutGuestDialog isOpen={isOpen} onClose={onClose}/>;
};

export default CheckoutDialog;