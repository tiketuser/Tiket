import React from "react";
import CustomInput from "../CustomInput/CustomInput";
import CardCarousel from "../TicketGallery/CarouselGallery";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import Image from "next/image";
import CustomTicketGallery from "../TicketGallery/ResponsiveGallery";
import ResponsiveGallery from "../TicketGallery/ResponsiveGallery";

const Gallery = () => {
  return (
    <div className="shadow-small-inner flex flex-col items-center pt-6">
      <CustomInput id="search-bar"
        className=''
        placeholder="חפש אירוע"
        image={
          <Image src={SearchIcon} alt="Search Icon" width={24} height={24} />
        }
      />
      <ResponsiveGallery />
    </div>
  );
};

export default Gallery;
