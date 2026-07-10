"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Renders a provider re-issued entry barcode (ownershipTransfer.newBarcode)
 * in its declared symbology so gate scanners can read it. Falls back to the
 * raw value in monospace if rendering fails (bad checksum, unknown format).
 */

// Protocol barcode_format values → bwip-js encoder ids.
const BCID: Record<string, string> = {
  qr: "qrcode",
  code128: "code128",
  pdf417: "pdf417",
  aztec: "azteccode",
  ean13: "ean13",
};

const SQUARE_FORMATS = new Set(["qr", "aztec"]);

export default function TicketBarcode({
  value,
  format,
}: {
  value: string;
  format?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const fmt = (format || "qr").toLowerCase();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const bwip = await import("bwip-js/browser");
        if (cancelled) return;
        bwip.toCanvas(canvas, {
          bcid: BCID[fmt] || "qrcode",
          text: value,
          scale: 3,
          ...(SQUARE_FORMATS.has(fmt)
            ? { width: 38, height: 38 }
            : { height: 14, includetext: false }),
        });
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, fmt]);

  return (
    <div
      dir="ltr"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "#fff",
        borderRadius: 12,
        padding: "16px 12px",
        width: "100%",
      }}
    >
      {failed ? (
        <div
          className="tk-mono"
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#0A0A0A",
            padding: "20px 4px",
            wordBreak: "break-all",
            textAlign: "center",
          }}
        >
          {value}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      )}
      {!failed && (
        <div
          className="tk-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "#667085",
            wordBreak: "break-all",
            textAlign: "center",
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
