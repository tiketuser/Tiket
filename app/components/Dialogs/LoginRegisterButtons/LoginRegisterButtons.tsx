import React from "react";

interface LoginRegisterButtonsProps {
    className?: string,
    redButton?: string,
    grayButton?: string
}

const LoginRegisterButtons: React.FC<LoginRegisterButtonsProps> = ({
    className = '',
    redButton = 'התחבר',
    grayButton = 'הירשם',
}) => {
    return (
        <div className={"flex justify-center items-center " + className}>
            <button className="transform -translate-x-4 w-[180px] h-[40px] bg-gray-200 text-black rounded-2xl ">
                <label className="pl-5 text-text-regular rtl">
                    {grayButton}
                </label>
                
            </button>
            <button className="transform translate-x-4 w-[167px] h-[40px] bg-primary text-white rounded-2xl text-text-regular rtl">
                {redButton}
            </button>
        </div> 
    );
  };
  
  export default LoginRegisterButtons;