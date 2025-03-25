"use client"

import CheckoutDialog from "@/app/components/Dialogs/CheckoutDialog/CheckoutDialog";
import { useRouter } from "next/navigation";

export default function Login () {
    const router = useRouter();
    return (
        <>
            <CheckoutDialog checkoutSuccess={false} isUserConnected={true} onClose={() => router.back()} isOpen={true} />
        </>
    );
};
