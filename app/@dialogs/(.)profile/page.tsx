"use client"

import ProfileDialog from "@/app/components/Dialogs/ProfileDialog/ProfileDialog";
import { useRouter } from "next/navigation";

export default function Login () {
    const router = useRouter();
    return (
        <>
            <ProfileDialog onClose={() => router.back()} isOpen={true} />
        </>
    );
};
