import MailIcon from "../../../public/images/404/MailIcon.svg";
import WhatsappIcon from "../../../public/images/404/WhatsappIcon.svg";
import OfficeIcon from "../../../public/images/404/OfficeIcon.svg";
import Image from "next/image";
import ContactItem from "../ContactItem/ContactItem";

const ContactSection = () => {
  return (
    <div className="pt-10 md:pt-14 px-4 md:px-6 pb-10 md:pb-14 w-full shadow-small-inner bg-secondary/30">
      <div className="flex flex-col text-center max-w-6xl mx-auto">
        <p className="text-text-regular md:text-text-large font-light text-subtext leading-6 md:leading-8">
          יש בעיה?
        </p>
        <h2 className="text-heading-2-desktop md:text-heading-1-desktop font-bold text-subtext leading-tight md:leading-[67px] my-2">
          צור קשר
        </h2>
        <p className="text-text-regular md:text-text-large font-light text-subtext leading-6 md:leading-8 max-w-2xl mx-auto">
          נשמח לשמוע ממך! אם יש לך שאלות, הערות או בעיות, אנחנו כאן כדי לעזור.
        </p>
      </div>
      <div className="flex justify-center w-full pt-10 md:pt-14">
        <div className="flex flex-col md:flex-row justify-center items-stretch w-full max-w-[950px] gap-6 md:gap-8 lg:gap-12">
          {/* Office */}
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

          {/* Whatsapp */}
          <ContactItem
            icon={
              <Image
                src={WhatsappIcon}
                alt="Whatsapp Icon"
                width={80}
                height={80}
              />
            }
            title="Whatsapp"
            description={[
              "מוזמנים לשלוח לנו וואטסאפ בכל שעה.",
              "אנחנו משתדלים להגיב בתוך 48 שעות.",
            ]}
            contactInfo="054-4437070"
          />

          {/* Email */}
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
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
