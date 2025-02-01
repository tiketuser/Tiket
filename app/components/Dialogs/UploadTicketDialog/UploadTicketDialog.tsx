import AdjustableDialog from "../AdjustableDialog/AdjustableDialog"
import ProgressBar from "../ProgressBar/ProgressBar";

// import { useState, useEffect } from "react";

interface UploadTicketInterface {
    isOpen: boolean;
    onClose: () => void;
}
const UploadTicketDialog: React.FC<UploadTicketInterface> = ({
    isOpen,
    onClose
}) => {
    return (
        <AdjustableDialog 
            isOpen={isOpen} 
            onClose={onClose}
            height="h-[912px]"
            width="w-[880px]"
        >
            <p>shgat</p>
            <ProgressBar step={4}/>
        </AdjustableDialog>
    )
}

export default UploadTicketDialog