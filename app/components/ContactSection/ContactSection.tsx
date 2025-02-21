import MailIcon from "../../../public/images/404/MailIcon.svg";
import WhatsappIcon from "../../../public/images/404/WhatsappIcon.svg";
import OfficeIcon from "../../../public/images/404/OfficeIcon.svg";
import Image from "next/image";
import ContactItem from "../ContactItem/ContactItem";

const ContactSection = () => {
  return (
    <div className="pt-14 pl-6 pr-6 pb-14 gap-14 w-full h-[611px] shadow-small-inner">
      <div className="flex flex-col text-center ">
        <p className="text-text-large font-light  text-subtext mt-2 leading-8">
          יש בעיה?
        </p>
        <h2 className="text-heading-1-desktop font-bold text-subtext leading-[67px]">
          צור קשר
        </h2>
        <p className="text-text-large font-light text-subtext leading-8">
          נשמח לשמוע ממך! אם יש לך שאלות, הערות או בעיות, אנחנו כאן כדי לעזור.
        </p>
      </div>
      <div className="flex justify-center w-full pt-14">
        <div className="flex justify-center max-w-[950px] gap-20">
          {/* משרד */}
          <ContactItem
            icon={
              <Image src={MailIcon} alt="Mail Icon" width={80} height={80} />
            }
            title="Email"
            description={[
              "מוזמנים לשלוח לנו אימייל בכל שעה.",
              "אנחנו משתדלים להגיב בתוך 48 שעות.",
            ]}
            contactInfo="avivnir2004@gmail.com"
          />

          {/* ווטסאפ */}
          <ContactItem
            icon={
              <Image
                src={WhatsappIcon}
                alt="Whatsapp Icon"
                width={80}
                height={80}
              />
            }
            title="Email"
            description={[
              "מוזמנים לשלוח לנו וואטסאפ בכל שעה.",
              "אנחנו משתדלים להגיב בתוך 48 שעות.",
            ]}
            contactInfo="054-4437070"
          />

          {/* אימייל */}
          <ContactItem
            icon={
              <Image
                src={OfficeIcon}
                alt="office Icon"
                width={80}
                height={80}
              />
            }
            title="Office"
            description={["מוזמנים להגיע למשרדים שלנו!", "בואו בהמוניכם"]}
            contactInfo="אברהם יפה 5 חולון"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
