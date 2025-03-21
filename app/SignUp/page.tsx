"use client";

import { useRouter } from "next/navigation";
import SignUpDialog from "../components/Dialogs/SignUpDialog/SignUpDialog";

const SignUp = () => {
    const router = useRouter();
    return <SignUpDialog isOpen={true} onClose={() => router.push("/")} />;
};

export default SignUp;