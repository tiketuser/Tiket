import React from "react";

/** One placeholder shape while content loads, after shadcn/ui's Skeleton:
 *  Tailwind's stock animate-pulse on the shape itself rather than on the
 *  whole card, so card frames stay put and only the content pulses. The fill
 *  comes from .tk-skeleton in globals.css (grey on desktop, cream on the
 *  mobile design), a step darker than the surface so the pulse shows. */
export default function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div aria-hidden="true" className={`tk-skeleton animate-pulse ${className}`.trim()} style={style} />
  );
}
