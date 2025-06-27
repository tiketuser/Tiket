import React from "react";

interface LoginSigninButtonInterface {
    text: string
    isDisabled? : boolean
}

const LoginSigninButton: React.FC<LoginSigninButtonInterface> = ({ 
    isDisabled = true,
    // text
}) => {

    const AbleDisableClassName = {
        able: 'bg-primary text-white',
        disable: 'btn-secondary bg-secondary text-white',
    };

    return (
        <div>
            <button
                id="submitButton"
                className={
                    `btn sm:w-[456px] w-[256px] sm:h-[48px] h-[32px] min-h-0 sm:text-text-large text-text-small 
                    ${isDisabled ? AbleDisableClassName.able : AbleDisableClassName.able}`
                }
                disabled={isDisabled}
            >
                התחבר
            </button>
        </div>
    );
};

export default LoginSigninButton
