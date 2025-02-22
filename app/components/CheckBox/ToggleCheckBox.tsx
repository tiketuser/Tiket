import React from "react"

interface ToggleCheckBoxProps {
    text?: string
    required?: boolean
    className?: string
}

const ToggleCheckBox: React.FC<ToggleCheckBoxProps> = ({
    text = "זכור אותי",
    required = false,
    className = "p-0"
}) => {
    return (
        <>
            <div className={"flex items-center gap-2"+className}>
                <input
                    type="checkbox"
                    className="toggle bg-white [--tglbg:gray] hover:bg-white"
                    required={required}
                />

                <label className="text-text-regular mr-2 text-strongText" >אפשר הצעה לכל מחיר</label>
            </div>
        </>
    )
}

export default ToggleCheckBox