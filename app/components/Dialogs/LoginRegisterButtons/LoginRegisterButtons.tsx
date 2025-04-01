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
            <button className="transform -translate-x-4 md:w-[180px] md:h-[40px] w-[125px] h-[28px] bg-gray-200 rounded-2xl ">
                <label className="pl-5 md:text-text-regular text-black text-text-extra-small rtl">
                    {grayButton}
                </label>
                
            </button>
            <button className="transform translate-x-4 md:w-[167px] w-[115px] md:h-[40px] h-[28px] bg-primary rounded-2xl">
                <label className="text-white md:text-text-regular text-text-extra-small rtl">
                    {redButton}
                </label>
            </button>
        </div> 
    );
  };
  
  export default LoginRegisterButtons;