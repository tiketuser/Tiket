interface Props {
  title: string;
  subtitle: string;
}

const TitleSubtitle: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <div className="pt-14 pr-6 pb-14 pl-6 shadow-xsmall-inner">
    <div className="flex justify-center flex-col gap-2 text-center" dir="rtl">
      <h1 className="text-heading-1-desktop font-bold leading-[68px] text-subtext">
        {title}
      </h1>
      <p className="text-heading-4-desktop font-extrabold leading-[42px] text-strongText">
        {subtitle}
      </p>
    </div>
    </div>
  );
};

export default TitleSubtitle;
