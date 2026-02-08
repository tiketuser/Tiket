"use client";

import React, { useState } from "react";
import AdjustableDialog from "../AdjustableDialog/AdjustableDialog";
import ProfileMenu from "../../ProfileMenu/ProfileMenu";
import UserDetails from "../../UserDetails/UserDetails";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose }) => {
  const [selectedSection, setSelectedSection] = useState("personal");

  return (
    <AdjustableDialog
      width="sm:w-[880px] xs:w-[400px] w-[310px]"
      height="sm:h-[835px] xs:h-[650px] h-[560px]"
      isOpen={isOpen}
      onClose={onClose}
      heading="הפרופיל שלי"
      description="פרטים אישיים"
    >
      <div className="w-full h-full flex flex-col sm:flex-row sm:mt-28 xs:mt-9 mt-3">
        <UserDetails section={selectedSection} />

        {/* תפריט – למטה במובייל, בצד בדסקטופ */}
        <div className="sm:w-64 w-full">
          <ProfileMenu onSelect={setSelectedSection} />
        </div>
      </div>
    </AdjustableDialog>
  );
};

export default ProfileDialog;
