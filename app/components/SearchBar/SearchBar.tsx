import Image from 'next/image';
import SearchIcon from "../../../public/images/SearchBar/Search Icon.svg";

const SearchBar = () => {
  return (
    <div className="flex justify-center items-center pt-9 sm:mx-0 mx-16">
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="חפש אירוע"
          className="w-full py-3 pl-12 pr-4 rounded-lg border border-gray-300 sm:text-text-medium text-text-small rtl focus:outline-none focus:ring-0 focus:border-gray-300"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Image
            src={SearchIcon}
            alt="Search Icon"
            width={24}
            height={24}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;