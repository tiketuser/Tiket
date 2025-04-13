"use client";

import React, { useState } from "react";

interface ProfileMenuProps {
  onSelect: (section: string) => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ onSelect }) => {
  const [activeSection, setActiveSection] = useState("personal");

  const menuItems = [
    { id: "personal", label: "פרטים אישיים" },
    { id: "payment", label: "פרטי תשלום" },
    { id: "activity", label: "סיכום פעולות" },
    { id: "disconnect", label: "התנתק" },
  ];

  return (
    <div className="w-full px-4 sm:w-64 sm:h-full sm:p-6">
      <ul className="flex flex-wrap sm:flex-col sm:space-y-4 gap-3 justify-center">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              className={`sm:w-full w-auto px-4 py-2 rounded-md sm:text-text-large xs:text-text-small text-text-extra-small leading-8 font-medium ${
                activeSection === item.id
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => {
                setActiveSection(item.id);
                onSelect(item.id);
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProfileMenu;
