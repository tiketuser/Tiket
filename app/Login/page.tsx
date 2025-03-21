"use client";

import { useRouter } from "next/navigation";
import LoginDialog from "../components/Dialogs/LoginDialog/LoginDialog";

const Login = () => {
    const router = useRouter();
    return <LoginDialog isOpen={true} onClose={() => router.push("/")} />;
};

export default Login;