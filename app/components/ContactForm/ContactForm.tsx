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
    <form onSubmit={handleSubmit} className="w-full max-w-[529px] p-4 sm:p-6">
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
        className={`w-full border p-3 px-4 rounded-lg mb-4 text-text-regular placeholder-mutedText focus:outline-none focus:ring-2 focus:ring-primary/20 ${
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
        className={`w-full border p-3 px-4 rounded-lg mb-4 text-text-regular placeholder-mutedText focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          errors.email ? "border-primary" : "border-weakText"
        }`}
      />

      {/* הודעה */}
      <textarea
        name="message"
        placeholder="כתוב את הודעתך"
        value={formData.message}
        onChange={handleChange}
        className={`w-full border p-3 px-4 rounded-lg mb-4 text-text-regular placeholder-mutedText h-[140px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          errors.message ? "border-primary" : "border-weakText"
        }`}
      />

      {/* כפתור שליחה */}
      <button
        type="submit"
        className="w-full bg-highlight text-white rounded-lg h-12 text-text-large font-semibold disabled:opacity-50 hover:bg-highlight/90 transition-colors"
        disabled={!formData.termsAccepted}
      >
        שלח
      </button>

      {/* אישור תנאים */}
      <div className="flex items-center mt-4 justify-center gap-2">
        <input
          type="checkbox"
          name="termsAccepted"
          checked={formData.termsAccepted}
          onChange={handleChange}
          className="w-4 h-4 border border-gray-300 rounded cursor-pointer accent-primary"
        />
        <label
          className="text-sm text-mutedText cursor-pointer"
          onClick={() =>
            handleChange({
              target: {
                name: "termsAccepted",
                type: "checkbox",
                checked: !formData.termsAccepted,
              },
            } as any)
          }
        >
          אני מאשר את תנאי השימוש
        </label>
      </div>
    </form>
  );
};

export default ContactForm;
