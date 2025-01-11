import React from "react";

interface LoginRegisterButtonsProps {
    className?: string
}

const LoginRegisterButtons: React.FC<LoginRegisterButtonsProps> = ({
    className = ''
}) => {
    return (
        <div className={"flex justify-center items-center " + className}>
            <button className="transform -translate-x-7 px-24 py-2 bg-gray-200 text-black rounded-2xl text-text-regular rtl">
                הירשם
            </button>
            <button className="transform translate-x-7 px-20 py-2 bg-primary text-white rounded-2xl text-text-regular rtl">
                התחבר
            </button>
        </div> 
    );
  };
  
  export default LoginRegisterButtons;