"use client"

import LoginDialog from "../../components/Dialogs/LoginDialog/LoginDialog";
import { useRouter } from "next/navigation";

export default function Login () {
    const router = useRouter();
    return (
        <>
            <LoginDialog onClose={() => router.back()} isOpen={true} />
        </>
    );
};
