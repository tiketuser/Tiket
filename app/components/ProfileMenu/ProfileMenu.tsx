"use client";

import React from "react";

interface ProfileMenuProps {
  onSelect: (section: string) => void;
  selected?: string;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onSelect,
  selected = "personal",
}) => {
  const menuItems = [
    { id: "personal", label: "פרטים אישיים" },
    { id: "payment", label: "תשלום" },
    { id: "activity", label: "פעולות" },
  ];

  return (
    <div className="border-b border-gray-100">
      <nav className="flex gap-0 overflow-x-auto scrollbar-hide px-2 sm:px-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
              selected === item.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ProfileMenu;
