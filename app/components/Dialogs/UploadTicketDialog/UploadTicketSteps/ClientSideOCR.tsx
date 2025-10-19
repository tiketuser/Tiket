"use client";

import { useState } from "react";

interface ClientSideOCRProps {
  imageFile: File;
  onExtract: (data: any) => void;
  onError: (error: string) => void;
}

export default function ClientSideOCR({
  imageFile,
  onExtract,
  onError,
}: ClientSideOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImage = async () => {
    try {
      setIsProcessing(true);
      setProgress(20);

      const formData = new FormData();
      formData.append("file", imageFile);

      setProgress(40);

      const response = await fetch("/api/ocr-extract", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!response.ok) {
        throw new Error(`OCR failed: ${response.status}`);
      }

      const data = await response.json();

      setProgress(100);

      if (data.error) {
        throw new Error(data.error);
      }

      onExtract(data);
    } catch (error) {
      console.error("OCR processing error:", error);
      onError(error instanceof Error ? error.message : "OCR processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={processImage}
        disabled={isProcessing}
        className="btn btn-primary"
      >
        {isProcessing ? `Processing... ${progress}%` : "Extract Text"}
      </button>
    </div>
  );
}
