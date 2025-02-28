import Image from "next/image";
import MinimalCard from "@/app/components/MinimalCard/MinimalCard";
import ShareIcon from "@/public/images/Dialogs/ShareIcon.svg";
import CloseIcon from "@/public/images/Dialogs/exitIcon.svg";
import Link from "next/link";

interface ThankYouProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="relative bg-white w-[880px] h-[700px] p-8 rounded-lg shadow-lg flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 hover:bg-gray-200 rounded-full transition"
        >
          <Image src={CloseIcon} alt="Close" width={20} height={20} />
        </button>

        {/* Order Number */}
        <p className="text-text-medium font-light text-weakTextBluish mb-2">
          הזמנה מספר #123RGR231567Y
        </p>

        {/* Title */}
        <h1 className="text-heading-1-desktop font-bold text-center">
          התשלום בוצע בהצלחה
        </h1>
        <p className="text-heading-5-desktop font-bold text-center text-strongText mt-2">
          ניתן לראות את הכרטיסים שרכשת יחד עם שאר הכרטיסים בבעלותך
        </p>

        {/* Main Buttons */}
        <div className="flex flex-col w-[604px] items-center gap-2 mt-6">
          <Link href="/MyTickets" className="w-full">
            <button className="h-[48px] w-full bg-primary text-white text-text-large font-normal rounded-lg transition duration-300 hover:bg-red-700">
              הכרטיסים שלי
            </button>
          </Link>

          <Link href="/" className="w-full">
            <button
              onClick={onClose}
              className="text-primary h-[48px] hover:bg-gray-200 text-text-large font-normal mt-2 w-full transition duration-300"
            >
              לדף הבית
            </button>
          </Link>
        </div>

        {/* Share Section */}
        <div className="flex flex-col items-center gap-3 mt-6 w-full">
          <p className="text-heading-5-desktop font-bold text-center">
            שתף את הכרטיס ברשתות החברתיות
          </p>
          <button className="w-[340px] h-[48px] flex items-center justify-center bg-secondary text-primary text-text-large font-normal rounded-lg gap-2 transition duration-300 hover:bg-gray-200">
            <span>שתף</span>
            <Image src={ShareIcon} alt="ShareIcon" width={20} height={20} />
          </button>
        </div>

        {/* "Download" & "Add to Calendar" Buttons */}
        <div className="flex justify-center h-[48px] gap-4 mt-6 text-text-large">
          <button className="border-[1.5px] border-primary text-primary px-6 py-2 rounded-lg transition duration-300 hover:bg-gray-100">
            הורדה
          </button>
          <button className="border-[1.5px] border-primary text-primary px-6 py-2 rounded-lg transition duration-300 hover:bg-gray-100">
            הוספה ליומן
          </button>
        </div>

        {/* Minimal Card (Ticket Preview) */}
        <div className="mt-6 w-full absolute bottom-0">
          <MinimalCard
            price={358}
            priceBefore={457}
            title="עלמה גוב"
            date="15 אוק׳"
            seatLocation="יציע 4, שורה 21 כיסא 3"
          />
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
