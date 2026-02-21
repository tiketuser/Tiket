import { Progress } from "@/components/ui/progress";

interface ProgressBarInterface {
  step?: number;
  totalSteps?: number;
}
const ProgressBar: React.FC<ProgressBarInterface> = ({
  step = 0,
  totalSteps = 4,
}) => {
  return (
    <div
      className={`grid gap-3 sm:gap-4 w-full max-w-[668px] px-2 sm:px-0`}
      dir="ltr"
      style={{ gridTemplateColumns: `repeat(${totalSteps}, 1fr)` }}
    >
      {Array.from({ length: totalSteps }).map((_, index) => {
        let value = 0;
        if (index < step - 1) value = 100;
        else if (index === step - 1) value = 75;

        return <Progress key={index} value={value} className="w-full h-1" />;
      })}
    </div>
  );
};

export default ProgressBar;
