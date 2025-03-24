"use client"

import SignUpDialog from "../../components/Dialogs/SignUpDialog/SignUpDialog";
import { useRouter } from "next/navigation";

export default function Login () {
    const router = useRouter();
    return (
        <>
            <SignUpDialog onClose={() => router.back()} isOpen={true} />
        </>
    );
};
