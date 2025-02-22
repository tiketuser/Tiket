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
    <div className="w-64 h-full p-6">
      <ul className="space-y-4">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              className={`w-full text-center px-4 py-2 rounded-md text-text-large leading-8 font-medium ${
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
