import React from 'react';
import Image from 'next/image';

import PlayingGuitar from '../../../public/images/girl-playing-gituar.svg';
import CircleDrawing from '../../../public/images/circle_drawing.svg';

const HeroSection = () => {
  return (
    <div className="relative bg-white pt-28 pb-12 mx-auto w-full shadow-md z-30">
      <div className="flex flex-col items-center text-right" dir="rtl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          הופעה סולד-אאוט? / לא יכולים להגיע?
        </h1>
        <p className="text-gray-600 mb-6">
          הזדמנות נוספת לכרטיסים - קנו ומכרו בקלות ובאופן מאובטח.
        </p>
        <div className="space-x-4 space-x-reverse">
          <button className="btn btn-secondary w-24 text-primary">מכור</button>
          <button className="btn btn-primary w-24 text-gray-50">קנה</button>
        </div>
      </div>

      <Image
        src={PlayingGuitar}
        alt="Playing Guitar"
        className="absolute bottom-0 left-0"
        style={{ width: '170px', height: '170px' }} 
      />

      <Image
        src={CircleDrawing}
        alt="Circle Drawing"
        className="absolute bottom-0 right-0"
        style={{ width: '230px', height: '230px' }} 
      />
    </div>
  );
};

export default HeroSection;
