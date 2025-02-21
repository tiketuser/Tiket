"use client";

import React, { useState } from "react";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    message: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    message: false,
    termsAccepted: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [target.name]: target.type === "checkbox" ? target.checked : target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // בדיקה אם כל השדות מולאו
    const newErrors = {
      fullName: formData.fullName.trim() === "",
      email: formData.email.trim() === "",
      message: formData.message.trim() === "",
      termsAccepted: !formData.termsAccepted,
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).includes(true)) {
      alert("הטופס נשלח בהצלחה!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[529px] mx-auto p-6">
      {/* שם מלא */}
      <input
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoCapitalize="none"
        type="text"
        name="fullName"
        placeholder="שם מלא"
        value={formData.fullName}
        onChange={handleChange}
        className={`w-full border border-weakText p-[10.5px] px-[16px] rounded-[8px] mb-3 text-text-regular placeholder-mutedText ${
          errors.fullName ? "border-primary" : "border-weakText"
        }`}
      />

      {/* אימייל */}
      <input
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        autoCapitalize="none"
        type="email"
        name="email"
        placeholder="אימייל"
        value={formData.email}
        onChange={handleChange}
        className={`w-full border border-weakText p-[10.5px] px-[16px] rounded-[8px] mb-3 text-text-regular placeholder-mutedText ${
          errors.email ? "border-primary" : "border-weakText"
        }`}
      />

      {/* הודעה */}
      <textarea
        name="message"
        placeholder="כתוב את הודעתך"
        value={formData.message}
        onChange={handleChange}
        className={`w-full border border-weakText p-[10.5px] px-[16px] rounded-[8px] mb-3 text-text-regular placeholder-mutedText h-[120px] resize-none ${
          errors.message ? "border-primary" : "border-weakText"
        }`}
      />

      {/* כפתור שליחה */}
      <button
        type="submit"
        className="w-full bg-highlight text-white rounded-[6px] h-12 pt-2 pr-4 pb-2 pl-4 text-text-large font-regular disabled:opacity-50"
        disabled={!formData.termsAccepted}
      >
        שלח
      </button>

      {/* אישור תנאים */}
      <div className="flex items-center mt-3 justify-center">
        <input
          type="checkbox"
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={handleChange}
          className="w-4 h-4 ml-2 border border-gray-300 rounded cursor-pointer"
        />
        <label className="text-sm text-mutedText">
          אני מאשר את תנאי השימוש
        </label>
      </div>
    </form>
  );
};

export default ContactForm;
