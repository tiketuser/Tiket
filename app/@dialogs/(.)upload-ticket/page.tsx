"use client"

import UploadTicketDialog from "../../components/Dialogs/UploadTicketDialog/UploadTicketDialog";
import { useRouter } from "next/navigation";

export default function Login () {
    const router = useRouter();
    return (
        <>
            <UploadTicketDialog onClose={() => router.back()} isOpen={true} />
        </>
    );
};
