"use client";

import React from "react";

interface ProfileMenuProps {
  onSelect: (section: string) => void;
  selected: string;
}

const menuItems = [
  { id: "personal", label: "פרטים אישיים" },
  { id: "payment", label: "תשלום" },
  { id: "activity", label: "פעולות" },
];

const ProfileMenu: React.FC<ProfileMenuProps> = ({ onSelect, selected }) => {
  return (
    <div className="flex border-b border-gray-200 px-4 sm:px-6">
      {menuItems.map((item) => (
        <button
          key={item.id}
          className={`flex-1 py-3 text-sm sm:text-base font-semibold transition-colors relative ${
            selected === item.id
              ? "text-primary"
              : "text-gray-400 hover:text-gray-600"
          }`}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
          {selected === item.id && (
            <span className="absolute bottom-0 inset-x-3 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default ProfileMenu;
