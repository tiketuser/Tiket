import React from 'react'
import SearchBar from "../SearchBar/SearchBar";
import CardCarousel from "../CardCarousel/CardCarousel";

const Gallery = () => {
  return (
    <div className='shadow-small-inner'>
        <SearchBar/>
        <CardCarousel/>
    </div>
  )
}

export default Gallery