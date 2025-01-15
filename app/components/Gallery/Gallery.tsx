import React from 'react'
import CustomInput from '../CustomInput/CustomInput';
import CardCarousel from "../CardCarousel/CardCarousel";
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";
import Image from 'next/image';

const Gallery = () => {
  return (
    <div className='shadow-small-inner'>
      <CustomInput
        className='flex justify-center items-center pt-6'
        placeholder="חפש אירוע"
        image = { <Image src={SearchIcon} alt="Search Icon" width={24} height={24}/> }
      />
      <CardCarousel/>
    </div>
  )
}

export default Gallery