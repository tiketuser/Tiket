import React from "react"

interface CheckBoxProps {
    text?: string
    required?: boolean
    className?: string
}

const CheckBox: React.FC<CheckBoxProps> = ({
    text = "זכור אותי",
    required = false,
    className = "p-0"
}) => {
    return (
        <>
            <label className={"label cursor-pointer justify-center"+className}>
                <input
                    type="checkbox"
                    required = {required}
                    className="checkbox border-weakTextBluish [--chkbg:white] [--chkfg:theme(colors.weakTextBluish)]" />
                <span className="text-text-regular mr-2 text-strongText">{text}</span>
            </label>
        </>
    )
}

export default CheckBox