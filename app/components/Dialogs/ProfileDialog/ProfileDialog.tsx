"use client";

import React, { useState } from "react";
import Image from "next/image";
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
      width="sm:w-[880px] w-[400px]"
      height="sm:h-[835px] h-[540px]"
      isOpen={isOpen}
      onClose={onClose}
      heading="הפרופיל שלי"
      description="פרטים אישיים"
    >
      <div className="w-full h-full flex mt-28">
        <UserDetails section={selectedSection} />
        <ProfileMenu onSelect={setSelectedSection} />
      </div>
    </AdjustableDialog>
  );
};

export default ProfileDialog;
