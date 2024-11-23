import React from 'react';
import Image from 'next/image';
import FacebookIcon from '../../../public/images/Home Page/Web/FacebookIcon.svg';
import InstagramIcon from '../../../public/images/Home Page/Web/InstagramIcon.svg';
import TwitterIcon from '../../../public/images/Home Page/Web/TwitterIcon.svg';
import YoutubeIcon from '../../../public/images/Home Page/Web/YoutubeIcon.svg';
import TiktokIcon from '../../../public/images/Home Page/Web/TiktokIcon.svg';

const Footer = () => {
  return (
    <footer className="bg-white flex justify-between items-center px-4 h-20 border-t-2 border-gray-200 ">
        <div className="flex items-center gap-3">
            <button className="flex items-center">
                <Image src={YoutubeIcon} alt="YouTubeIcon" />
            </button>

            <button className="flex items-center">
                <Image src={FacebookIcon} alt="FacebookIcon"/>
            </button>

            <button className="flex items-center">
                <Image src={TiktokIcon} alt="TiktokIcon"/>
            </button>

            <button className="flex items-center">
                <Image src={TwitterIcon} alt="TwitterIcon" />
            </button>

            <button className="flex items-center">
                <Image src={InstagramIcon} alt="InstagramIcon" />
            </button>

        </div>
        <div className="flex items-center gap-7 px-32">
            <a href="#" className="link link-hover text-text-medium font-light">
            צור קשר
            </a>
            <a href="#" className="link link-hover text-text-medium font-light">
            תנאי שימוש
            </a>
            <a href="#" className="link link-hover text-text-medium font-light">
            מדיניות פרטיות
            </a>
            <a href="#" className="link link-hover text-text-medium font-light">
            שאלות נפוצות / עזרה
            </a>
        </div>
        
        <div className="border-t-2 border-gray-300 flex-grow"></div>
    
    </footer>
  );
};

export default Footer;
