interface Props {
  title: string;
  subtitle: string;
}

const TitleSubtitle: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <div className="pt-14 pr-6 pb-14 pl-6 shadow-xsmall-inner">
      <div
        className="flex justify-center flex-col sm:gap-2 gap-2 text-center"
        dir="rtl"
      >
        <h1 className="sm:text-heading-1-desktop text-heading-2-mobile font-bold sm:leading-[68px] text-subtext">
          {title}
        </h1>
        <p className="sm:text-heading-4-desktop text-heading-5-mobile  font-extrabold sm:leading-[42px] text-strongText">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default TitleSubtitle;
