import { Progress } from "@/components/ui/progress";

const ProgressBar = ({ step }: { step: number }) => {
    return (
        <div className="grid grid-cols-4 gap-4 w-[668px]" dir="ltr">
            {Array.from({ length: 4 }).map((_, index) => {
                let value = 0;
                if (index < step - 1) value = 100; // Full progress for previous steps
                else if (index === step - 1) value = 75; // Partial progress for the current step

                return <Progress key={index} value={value} className="w-full h-1" />;
            })}
        </div>
    );
};

export default ProgressBar;

